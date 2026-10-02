// Xuất ảnh PNG bằng dòng lệnh (không cần mở trang quản lý).
//
//   node scripts/render.mjs 7.3a                  → toàn bộ ảnh (3840×2160)
//   node scripts/render.mjs 7.3a samira overview  → chỉ vài ảnh
//   node scripts/render.mjs tier-2026-09-30       → tier list (ảnh lưu ở tierlists/<id>/out/)
//   node scripts/render.mjs build-2026-10-02-mid  → bộ build: khổ 16:9 (out/) VÀ khổ vuông 1:1 2160×2160 (out/1x1/)
//        --wide    chỉ khổ 16:9        --square   chỉ khổ vuông
//
// Ảnh lưu vào <bộ ảnh>/out/. Nếu server chưa chạy, script tự bật tạm rồi tắt.
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileName, hasSquare, SQUARE_DIR } from '../src/js/lib/output.js';
import { collectionDir, collectionFile } from '../src/js/lib/collections.js';
import { ROOT } from './lib/patches.mjs';
import { removeStale } from './lib/outdir.mjs';
import { ensureServer } from './lib/ensure-server.mjs';

const args = process.argv.slice(2);
const [patchId, ...only] = args.filter((a) => !a.startsWith('--'));
if (!patchId) {
  console.log('Cách dùng: node scripts/render.mjs <bộ ảnh> [slide...] [--wide | --square]');
  process.exit(1);
}
const formats = args.includes('--square') ? ['square'] : args.includes('--wide') ? ['wide'] : ['wide', 'square'];
const LABEL = { wide: '', square: ' · 1:1' };

const { origin, stop } = await ensureServer();
try {
  const patch = JSON.parse(await readFile(path.join(ROOT, collectionFile(patchId)), 'utf8'));
  const slides = patch.slides.filter((s) => !only.length || only.includes(s.id));
  const done = { wide: 0, square: 0 };
  for (const format of formats) {
    // khổ vuông: chỉ các ảnh có bản vuông (ảnh build, tổng quan build)
    for (const s of slides.filter((x) => format === 'wide' || hasSquare(x))) {
      const t = Date.now();
      const res = await fetch(`${origin}/api/render?${new URLSearchParams({ patch: patchId, slide: s.id, format })}`);
      if (!res.ok) {
        console.error(`✘ ${s.id}${LABEL[format]}: ${(await res.json().catch(() => ({}))).error ?? res.status}`);
        process.exitCode = 1;
        continue;
      }
      done[format]++;
      const warnings = decodeURIComponent(res.headers.get('X-Warnings') ?? '');
      console.log(`✔ ${s.id}${LABEL[format]} (${Date.now() - t}ms)${warnings ? `\n  ⚠ ${warnings}` : ''}`);
    }
    if (!only.length) {
      // xuất toàn bộ → xoá ảnh cũ không còn trong danh sách (vd sau khi đổi thứ tự ảnh)
      const keep = patch.slides.map((s, i) => [s, i]).filter(([s]) => format === 'wide' || hasSquare(s)).map(([s, i]) => fileName(patchId, i, s.id, format));
      for (const f of await removeStale(patchId, keep, format)) console.log(`  đã xoá ảnh cũ ${f}`);
    }
  }
  const dir = `${collectionDir(patchId)}/out/`;
  console.log(`\nẢnh đã lưu ở ${[done.wide ? `${dir} (16:9 · 3840×2160)` : '', done.square ? `${dir}${SQUARE_DIR}/ (1:1 · 2160×2160)` : ''].filter(Boolean).join(' và ')}`);
} finally {
  stop();
}
