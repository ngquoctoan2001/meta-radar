// Thư mục ảnh đã xuất: patches/<patch>/out/ hoặc tierlists/<id>/out/. Dùng chung cho server và script dòng lệnh.
import { readdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import { ROOT } from './patches.mjs';
import { collectionDir } from '../../src/js/lib/collections.js';

export const outDir = (id) => path.join(ROOT, collectionDir(id), 'out');

// Xoá ảnh PNG cũ không còn thuộc danh sách hiện tại (vd sau khi đổi thứ tự ảnh, hoặc file
// "@2x" / bản 1920×1080 từ trước khi chỉ còn một khổ 3840×2160). Trả về tên các file đã xoá.
export async function removeStale(patchId, keep) {
  const removed = [];
  for (const f of await readdir(outDir(patchId)).catch(() => [])) {
    if (f.endsWith('.png') && !keep.includes(f)) {
      await unlink(path.join(outDir(patchId), f));
      removed.push(f);
    }
  }
  return removed;
}
