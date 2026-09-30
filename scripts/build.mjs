// Build bản web tĩnh vào dist/ để deploy lên Cloudflare Pages (hoặc host tĩnh bất kỳ).
//
//   npm run build
//
// Bản tĩnh không có server nên chỉ để xem ảnh: danh sách patch đọc từ patches/index.json
// (tạo ở đây thay cho GET /api/patches), không có nút tải PNG / ZIP.

import { cp, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { ROOT, listPatches } from './lib/patches.mjs';

const DIST = path.join(ROOT, 'dist');
const COPY = ['index.html', 'slide.html', 'src', 'assets', 'data', 'patches'];

await rm(DIST, { recursive: true, force: true });
for (const p of COPY) {
  await cp(path.join(ROOT, p), path.join(DIST, p), {
    recursive: true,
    // bỏ ảnh đã xuất trong patches/<bản>/out/
    filter: (src) => path.basename(src) !== 'out',
  });
}

const patches = await listPatches();
// bản dịch .md nằm ngoài thư mục đã copy (nếu có)
for (const { sourceFile } of patches) {
  if (sourceFile && !COPY.includes(sourceFile.split('/')[0])) await cp(path.join(ROOT, sourceFile), path.join(DIST, sourceFile));
}
await writeFile(path.join(DIST, 'patches', 'index.json'), JSON.stringify(patches));

console.log(`✔ dist/ — ${patches.length} patch, ${patches.reduce((n, p) => n + p.slides.length, 0)} ảnh`);
