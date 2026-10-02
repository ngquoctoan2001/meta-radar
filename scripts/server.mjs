// Server local: phục vụ trang quản lý (xem trước) + xuất ảnh PNG vào thư mục out/ của bộ ảnh.
//
//   node scripts/server.mjs          → http://localhost:5173
//   node scripts/server.mjs --open   → tự mở trình duyệt
//
// API:
//   GET /api/patches                         danh sách bộ ảnh (bản cập nhật + tier list + build) + danh sách ảnh
//   GET /api/render?patch=7.3a&slide=samira  vẽ 1 ảnh PNG và lưu vào out/ (scripts/render.mjs gọi API này)
//   GET /api/open-folder?patch=7.3a          mở thư mục out/ của bộ ảnh bằng File Explorer
// patch = id bộ ảnh: 7.3a (patches/7.3a/), tier-2026-09-30 (tierlists/…) hoặc build-2026-10-02-mid (builds/…).
// Cỡ ảnh theo loại ảnh — xem src/js/lib/output.js (16:9 3840×2160 · build vuông 2160×2160 · thumbnail dọc 2160×2880).

import http from 'node:http';
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec } from 'node:child_process';
import { renderSlide, closeBrowser } from './lib/renderer.mjs';
import { readJSON, listCollections } from './lib/patches.mjs';
import { collectionFile } from '../src/js/lib/collections.js';
import { outDir } from './lib/outdir.mjs';
import { API_VERSION } from './lib/ensure-server.mjs';
import { fileName } from '../src/js/lib/output.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT ?? 5173);
const ORIGIN = `http://localhost:${PORT}`;

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.md': 'text/markdown; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.ico': 'image/x-icon',
};

async function renderAndSave(patchId, slideId) {
  const patch = await readJSON(collectionFile(patchId));
  const index = patch.slides.findIndex((s) => s.id === slideId);
  if (index < 0) throw Object.assign(new Error(`Không có ảnh "${slideId}"`), { status: 404 });
  const { png, warnings } = await renderSlide(ORIGIN, patchId, slideId);
  const name = fileName(patchId, index, slideId);
  const dir = outDir(patchId);
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
      const { name, png, warnings } = await renderAndSave(patchId, q.get('slide') ?? '');
      console.log(`✔ ${name} (${Date.now() - t}ms)`);
      return send(res, 200, png, { 'Content-Type': 'image/png', 'X-Warnings': encodeURIComponent(warnings.join(' | ')) });
    }
    case '/api/open-folder': {
      // mở thư mục ảnh đã xuất bằng File Explorer (chỉ dùng trên máy local)
      const dir = outDir(patchId);
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
