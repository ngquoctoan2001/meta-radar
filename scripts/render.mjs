// Xuất ảnh PNG bằng dòng lệnh (không cần mở trang quản lý).
//
//   node scripts/render.mjs 7.3a                  → toàn bộ ảnh, độ nét 2x (3840×2160)
//   node scripts/render.mjs 7.3a samira overview  → chỉ vài ảnh
//   node scripts/render.mjs 7.3a --scale=1        → bản chuẩn 1920×1080
//
// Ảnh lưu vào patches/<patch>/out/. Nếu server chưa chạy, script tự bật tạm rồi tắt.
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { DEFAULT_SCALE, isScale, fileName } from '../src/js/lib/output.js';
import { ROOT } from './lib/patches.mjs';
import { removeStale } from './lib/outdir.mjs';
import { ensureServer } from './lib/ensure-server.mjs';

const args = process.argv.slice(2);
const scale = Number(args.find((a) => a.startsWith('--scale='))?.split('=')[1] ?? DEFAULT_SCALE);
const [patchId, ...only] = args.filter((a) => !a.startsWith('--'));
if (!patchId || !isScale(scale)) {
  console.log('Cách dùng: node scripts/render.mjs <patch> [slide...] [--scale=1|2]');
  process.exit(1);
}

const { origin, stop } = await ensureServer();
try {
  const patch = JSON.parse(await readFile(path.join(ROOT, 'patches', patchId, 'patch.json'), 'utf8'));
  const slides = patch.slides.filter((s) => !only.length || only.includes(s.id));
  for (const s of slides) {
    const t = Date.now();
    const res = await fetch(`${origin}/api/render?${new URLSearchParams({ patch: patchId, slide: s.id, scale })}`);
    if (!res.ok) {
      console.error(`✘ ${s.id}: ${(await res.json().catch(() => ({}))).error ?? res.status}`);
      process.exitCode = 1;
      continue;
    }
    const warnings = decodeURIComponent(res.headers.get('X-Warnings') ?? '');
    console.log(`✔ ${s.id} (${Date.now() - t}ms)${warnings ? `\n  ⚠ ${warnings}` : ''}`);
  }
  if (!only.length) {
    // xuất toàn bộ → xoá ảnh cũ không còn trong danh sách (vd sau khi đổi thứ tự ảnh)
    const keep = patch.slides.map((s, i) => fileName(patchId, i, s.id, scale));
    for (const f of await removeStale(patchId, scale, keep)) console.log(`  đã xoá ảnh cũ ${f}`);
  }
  console.log(`\nẢnh đã lưu ở patches/${patchId}/out/ (${scale}x)`);
} finally {
  stop();
}
