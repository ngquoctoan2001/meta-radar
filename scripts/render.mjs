// Xuất ảnh PNG bằng dòng lệnh (không cần mở trang quản lý).
//
//   node scripts/render.mjs 7.3a                  → toàn bộ ảnh (16:9 · 3840×2160)
//   node scripts/render.mjs 7.3a samira overview  → chỉ vài ảnh
//   node scripts/render.mjs tier-2026-09-30       → tier list (ảnh lưu ở tierlists/<id>/out/)
//   node scripts/render.mjs build-2026-10-02-mid  → bộ build (vuông 1:1 · 2160×2160, thumbnail dọc 2160×2880)
//
// Ảnh lưu vào <bộ ảnh>/out/. Nếu server chưa chạy, script tự bật tạm rồi tắt.
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileName } from '../src/js/lib/output.js';
import { collectionDir, collectionFile } from '../src/js/lib/collections.js';
import { ROOT } from './lib/patches.mjs';
import { removeStale } from './lib/outdir.mjs';
import { ensureServer } from './lib/ensure-server.mjs';

const [patchId, ...only] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (!patchId) {
  console.log('Cách dùng: node scripts/render.mjs <bộ ảnh> [slide...]');
  process.exit(1);
}

const { origin, stop } = await ensureServer();
try {
  const patch = JSON.parse(await readFile(path.join(ROOT, collectionFile(patchId)), 'utf8'));
  for (const s of patch.slides.filter((x) => !only.length || only.includes(x.id))) {
    const t = Date.now();
    const res = await fetch(`${origin}/api/render?${new URLSearchParams({ patch: patchId, slide: s.id })}`);
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
    for (const f of await removeStale(patchId, patch.slides.map((s, i) => fileName(patchId, i, s.id)))) console.log(`  đã xoá ảnh cũ ${f}`);
  }
  console.log(`\nẢnh đã lưu ở ${collectionDir(patchId)}/out/`);
} finally {
  stop();
}
