// Server local: phục vụ trang quản lý + xuất ảnh PNG / ZIP.
//
//   node scripts/server.mjs          → http://localhost:5173
//   node scripts/server.mjs --open   → tự mở trình duyệt
//
// API (format = 16x9 | 9x16 | 1x1, mặc định 16x9):
//   GET /api/patches                                    danh sách patch + danh sách ảnh
//   GET /api/render?patch=7.3a&slide=samira&format=9x16 ảnh PNG (thêm &download=1 để tải về)
//   GET /api/render-all?patch=7.3a&format=9x16          toàn bộ ảnh của patch trong 1 file .zip
// Ảnh xuất ra cũng được lưu vào patches/<patch>/out/<format>/.

import http from 'node:http';
import { readFile, readdir, writeFile, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec } from 'node:child_process';
import { renderSlide, closeBrowser } from './lib/renderer.mjs';
import { createZip } from './lib/zip.mjs';
import { FORMATS, DEFAULT_FORMAT, isFormat, fileName } from '../src/js/lib/formats.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT ?? 5173);
const ORIGIN = `http://localhost:${PORT}`;

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.md': 'text/markdown; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.ico': 'image/x-icon',
};

const readJSON = async (p) => JSON.parse(await readFile(path.join(ROOT, p), 'utf8'));
const tryJSON = (p) => readJSON(p).catch(() => null);

// So sánh số phiên bản kiểu 7.3a > 7.2b > 7.2
const verKey = (id) => id.split(/(\d+)/).filter(Boolean).map((p) => (/^\d+$/.test(p) ? p.padStart(4, '0') : p)).join('');

async function listPatches() {
  const dirs = await readdir(path.join(ROOT, 'patches'), { withFileTypes: true });
  const patches = [];
  for (const d of dirs.filter((x) => x.isDirectory())) {
    const patch = await tryJSON(`patches/${d.name}/patch.json`);
    if (!patch) continue;
    const slides = [];
    for (const [i, s] of patch.slides.entries()) {
      let label = s.title ?? s.id;
      let status = null;
      if (s.type === 'champion') {
        const c = await tryJSON(`data/champions/${s.ref}.json`);
        label = c?.name ?? s.ref;
        status = patch.champions.find((x) => x.slug === s.ref)?.status ?? null;
      } else if (s.type === 'item') {
        const it = await tryJSON(`data/items/${s.ref}.json`);
        label = it?.name ?? s.ref;
        status = patch.items.find((x) => x.slug === s.ref)?.status ?? null;
      }
      slides.push({ ...s, label, status, index: i });
    }
    const count = (st) => patch.champions.filter((c) => c.status === st).length;
    patches.push({
      id: patch.id,
      title: patch.title,
      date: patch.date,
      headline: patch.headline,
      sourceFile: patch.sourceFile,
      counts: { buff: count('buff'), nerf: count('nerf'), mixed: count('adjust') + count('mixed'), items: patch.items?.length ?? 0, systems: patch.systems?.length ?? 0 },
      slides,
    });
  }
  return patches.sort((a, b) => verKey(b.id).localeCompare(verKey(a.id)));
}

async function renderAndSave(patchId, slideId, format) {
  const patch = await readJSON(`patches/${patchId}/patch.json`);
  const index = patch.slides.findIndex((s) => s.id === slideId);
  if (index < 0) throw Object.assign(new Error(`Không có ảnh "${slideId}"`), { status: 404 });
  const { png, warnings } = await renderSlide(ORIGIN, patchId, slideId, format);
  const name = fileName(patchId, index, slideId, format);
  const outDir = path.join(ROOT, 'patches', patchId, 'out', format);
  await mkdir(outDir, { recursive: true });
  await writeFile(path.join(outDir, name), png);
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
  const format = q.get('format') ?? DEFAULT_FORMAT;
  if (!isFormat(format)) return sendJSON(res, 400, { error: `Khổ ảnh không hợp lệ (${Object.keys(FORMATS).join(', ')})` });

  switch (url.pathname) {
    case '/api/health':
      return sendJSON(res, 200, { ok: true });
    case '/api/patches':
      return sendJSON(res, 200, await listPatches());
    case '/api/render': {
      const t = Date.now();
      const { name, png, warnings } = await renderAndSave(patchId, q.get('slide') ?? '', format);
      console.log(`✔ ${name} (${Date.now() - t}ms)`);
      const headers = { 'Content-Type': 'image/png', 'X-Warnings': encodeURIComponent(warnings.join(' | ')) };
      if (q.get('download')) headers['Content-Disposition'] = attachment(name);
      return send(res, 200, png, headers);
    }
    case '/api/render-all': {
      const patch = await readJSON(`patches/${patchId}/patch.json`);
      const files = [];
      for (const s of patch.slides) {
        const { name, png } = await renderAndSave(patchId, s.id, format);
        console.log(`✔ ${name}`);
        files.push({ name, data: png });
      }
      return send(res, 200, createZip(files), { 'Content-Type': 'application/zip', 'Content-Disposition': attachment(`toc-chien-${patchId}-${format}.zip`) });
    }
    case '/api/open-folder': {
      // mở thư mục ảnh đã xuất bằng File Explorer (chỉ dùng trên máy local)
      const dir = path.join(ROOT, 'patches', patchId, 'out', format);
      await mkdir(dir, { recursive: true });
      exec(`explorer "${dir}"`);
      return sendJSON(res, 200, { ok: true });
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
