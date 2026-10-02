// Thư mục ảnh đã xuất: patches/<patch>/out/ hoặc tierlists/<id>/out/. Dùng chung cho server và script dòng lệnh.
import { readdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import { ROOT } from './patches.mjs';
import { collectionDir } from '../../src/js/lib/collections.js';
import { SQUARE_DIR } from '../../src/js/lib/output.js';

// 16:9 (và ảnh bìa): out/ · bản vuông 1:1: out/1x1/
export const outDir = (id, format) => path.join(ROOT, collectionDir(id), 'out', ...(format === 'square' ? [SQUARE_DIR] : []));

// Xoá ảnh PNG cũ không còn thuộc danh sách hiện tại (vd sau khi đổi thứ tự ảnh, hoặc file
// "@2x" / bản 1920×1080 từ trước khi chỉ còn một khổ 3840×2160). Trả về tên các file đã xoá.
export async function removeStale(patchId, keep, format) {
  const removed = [];
  for (const f of await readdir(outDir(patchId, format)).catch(() => [])) {
    if (f.endsWith('.png') && !keep.includes(f)) {
      await unlink(path.join(outDir(patchId, format), f));
      removed.push(f);
    }
  }
  return removed;
}
