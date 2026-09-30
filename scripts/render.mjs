// Xuất ảnh PNG bằng dòng lệnh (không cần mở trang quản lý).
//
//   node scripts/render.mjs 7.3a                  → toàn bộ ảnh, cả 3 khổ
//   node scripts/render.mjs 7.3a samira overview  → chỉ vài ảnh
//   node scripts/render.mjs 7.3a --format=9x16    → chỉ 1 khổ (16x9 | 9x16 | 1x1)
//
// Ảnh lưu vào patches/<patch>/out/<khổ>/. Nếu server chưa chạy, script tự bật tạm rồi tắt.
import { spawn } from 'node:child_process';
import { readFile, readdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FORMATS, isFormat, fileName } from '../src/js/lib/formats.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT ?? 5173);
const ORIGIN = `http://localhost:${PORT}`;

const args = process.argv.slice(2);
const formatArg = args.find((a) => a.startsWith('--format='))?.split('=')[1];
const [patchId, ...only] = args.filter((a) => !a.startsWith('--'));
if (!patchId || (formatArg && !isFormat(formatArg))) {
  console.log('Cách dùng: node scripts/render.mjs <patch> [slide...] [--format=16x9|9x16|1x1]');
  process.exit(1);
}
const formats = formatArg ? [formatArg] : Object.keys(FORMATS);

const isUp = () => fetch(`${ORIGIN}/api/health`).then((r) => r.ok, () => false);

let child;
if (!(await isUp())) {
  child = spawn(process.execPath, [path.join(ROOT, 'scripts', 'server.mjs')], { stdio: 'ignore', env: { ...process.env, PORT: String(PORT) } });
  for (let i = 0; i < 50 && !(await isUp()); i++) await new Promise((r) => setTimeout(r, 200));
}

try {
  const patch = JSON.parse(await readFile(path.join(ROOT, 'patches', patchId, 'patch.json'), 'utf8'));
  const slides = patch.slides.filter((s) => !only.length || only.includes(s.id));
  for (const format of formats) {
    for (const s of slides) {
      const t = Date.now();
      const res = await fetch(`${ORIGIN}/api/render?${new URLSearchParams({ patch: patchId, slide: s.id, format })}`);
      if (!res.ok) {
        console.error(`✘ ${format} ${s.id}: ${(await res.json().catch(() => ({}))).error ?? res.status}`);
        process.exitCode = 1;
        continue;
      }
      const warnings = decodeURIComponent(res.headers.get('X-Warnings') ?? '');
      console.log(`✔ ${format.padEnd(4)} ${s.id} (${Date.now() - t}ms)${warnings ? `\n  ⚠ ${warnings}` : ''}`);
    }
    if (!only.length) {
      // xuất toàn bộ → xoá ảnh cũ không còn trong danh sách (vd sau khi đổi thứ tự ảnh)
      const keep = patch.slides.map((s, i) => fileName(patchId, i, s.id, format));
      const dir = path.join(ROOT, 'patches', patchId, 'out', format);
      for (const f of await readdir(dir).catch(() => [])) {
        if (f.endsWith('.png') && !keep.includes(f)) {
          await unlink(path.join(dir, f));
          console.log(`  đã xoá ảnh cũ ${format}/${f}`);
        }
      }
    }
  }
  console.log(`\nẢnh đã lưu ở patches/${patchId}/out/<khổ>/`);
} finally {
  child?.kill();
}
