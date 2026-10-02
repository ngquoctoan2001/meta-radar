// Server local: phục vụ trang quản lý + xuất ảnh PNG / ZIP.
//
//   node scripts/server.mjs          → http://localhost:5173
//   node scripts/server.mjs --open   → tự mở trình duyệt
//
// API (ảnh 3840×2160; thêm &format=square cho bản vuông 2160×2160 của ảnh build, lưu ở out/1x1/):
//   GET /api/patches                         danh sách bộ ảnh (bản cập nhật + tier list) + danh sách ảnh
//   GET /api/render?patch=7.3a&slide=samira  ảnh PNG (thêm &download=1 để tải về)
//   GET /api/render-all?patch=7.3a           toàn bộ ảnh của bộ ảnh trong 1 file .zip
// patch = id bộ ảnh: 7.3a (patches/7.3a/) hoặc tier-2026-09-30 (tierlists/tier-2026-09-30/).
// Ảnh xuất ra cũng được lưu vào thư mục out/ của bộ ảnh.

import http from 'node:http';
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec } from 'node:child_process';
import { renderSlide, closeBrowser } from './lib/renderer.mjs';
import { createZip } from './lib/zip.mjs';
import { readJSON, listCollections } from './lib/patches.mjs';
import { collectionFile } from '../src/js/lib/collections.js';
import { outDir, removeStale } from './lib/outdir.mjs';
import { API_VERSION } from './lib/ensure-server.mjs';
import { fileName, formatOf, hasSquare } from '../src/js/lib/output.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT ?? 5173);
const ORIGIN = `http://localhost:${PORT}`;

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.md': 'text/markdown; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.ico': 'image/x-icon',
};

// format 'square' → bản vuông 1:1 (chỉ loại ảnh có bản vuông; loại khác vẫn xuất 16:9), lưu ở out/1x1/
async function renderAndSave(patchId, slideId, formatArg) {
  const patch = await readJSON(collectionFile(patchId));
  const index = patch.slides.findIndex((s) => s.id === slideId);
  if (index < 0) throw Object.assign(new Error(`Không có ảnh "${slideId}"`), { status: 404 });
  const format = formatOf(patch.slides[index], formatArg);
  const { png, warnings } = await renderSlide(ORIGIN, patchId, slideId, format);
  const name = fileName(patchId, index, slideId, format);
  const dir = outDir(patchId, format);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), png);
  if (warnings.length) console.warn(`  ⚠ ${name}:\n    ${warnings.join('\n    ')}`);
  return { name, png, warnings };
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'Cache-Control': 'no-store', ...headers });
  res.end(body);
}
const sendJSON = (res, status, data) => send(res, status, JSON.stringify(data), { 'Content-Type': MIME['.json'] });
const attachment = (name) => `attachment; filename="${name}"; filename*=UTF-8''${encodeURIComponent(name)}`;

async function handleApi(url, res) {
  const q = url.searchParams;
  const patchId = q.get('patch') ?? '';
  if (patchId && !/^[\w.-]+$/.test(patchId)) return sendJSON(res, 400, { error: 'Tên patch không hợp lệ' });

  switch (url.pathname) {
    case '/api/health':
      return sendJSON(res, 200, { ok: true, api: API_VERSION });
    case '/api/patches':
      return sendJSON(res, 200, await listCollections());
    case '/api/render': {
      const t = Date.now();
      const { name, png, warnings } = await renderAndSave(patchId, q.get('slide') ?? '', q.get('format'));
      console.log(`✔ ${name} (${Date.now() - t}ms)`);
      const headers = { 'Content-Type': 'image/png', 'X-Warnings': encodeURIComponent(warnings.join(' | ')) };
      if (q.get('download')) headers['Content-Disposition'] = attachment(name);
      return send(res, 200, png, headers);
    }
    case '/api/render-all': {
      const patch = await readJSON(collectionFile(patchId));
      // format=square: chỉ các ảnh có bản vuông
      const square = q.get('format') === 'square';
      const files = [];
      for (const s of patch.slides.filter((x) => !square || hasSquare(x))) {
        const { name, png } = await renderAndSave(patchId, s.id, square ? 'square' : 'wide');
        console.log(`✔ ${name}`);
        files.push({ name, data: png });
      }
      await removeStale(patchId, files.map((f) => f.name), square ? 'square' : 'wide');
      const zipName = `toc-chien-${patchId}${square ? '-1x1' : ''}.zip`;
      return send(res, 200, createZip(files), { 'Content-Type': 'application/zip', 'Content-Disposition': attachment(zipName) });
    }
    case '/api/open-folder': {
      // mở thư mục ảnh đã xuất bằng File Explorer (chỉ dùng trên máy local)
      const dir = outDir(patchId, q.get('format'));
      await mkdir(dir, { recursive: true });
      exec(`explorer "${dir}"`);
      return sendJSON(res, 200, { ok: true, api: API_VERSION });
    }
    default:
      return sendJSON(res, 404, { error: 'API không tồn tại' });
  }
}

async function handleStatic(url, res) {
  let rel = decodeURIComponent(url.pathname);
  if (rel === '/') rel = '/index.html';
  const file = path.normalize(path.join(ROOT, rel));
  if (!file.startsWith(ROOT) || rel.includes('/node_modules/')) return send(res, 403, 'Forbidden');
  try {
    const st = await stat(file);
    if (!st.isFile()) return send(res, 404, 'Not found');
    const body = await readFile(file);
    send(res, 200, body, { 'Content-Type': MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream' });
  } catch {
    send(res, 404, 'Not found');
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, ORIGIN);
  try {
    if (url.pathname.startsWith('/api/')) await handleApi(url, res);
    else await handleStatic(url, res);
  } catch (err) {
    console.error(`✘ ${url.pathname}${url.search}: ${err.message}`);
    if (!res.headersSent) sendJSON(res, err.status ?? 500, { error: err.message });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`\n  Meta Tốc Chiến Studio → ${ORIGIN}\n  (Ctrl+C để tắt)\n`);
  if (process.argv.includes('--open')) exec(`start "" "${ORIGIN}"`, { shell: 'cmd.exe' });
});

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, async () => {
    await closeBrowser().catch(() => {});
    process.exit(0);
  });
}
