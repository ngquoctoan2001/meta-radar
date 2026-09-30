// Thư mục ảnh đã xuất: patches/<patch>/out/. Dùng chung cho server và script dòng lệnh.
import { readdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import { ROOT } from './patches.mjs';

export const outDir = (patchId) => path.join(ROOT, 'patches', patchId, 'out');

// Xoá ảnh PNG cũ (cùng độ nét) không còn thuộc danh sách hiện tại, vd sau khi đổi thứ tự ảnh.
// Trả về tên các file đã xoá.
export async function removeStale(patchId, scale, keep) {
  const is2x = Number(scale) === 2;
  const removed = [];
  for (const f of await readdir(outDir(patchId)).catch(() => [])) {
    if (f.endsWith('.png') && f.includes('@2x') === is2x && !keep.includes(f)) {
      await unlink(path.join(outDir(patchId), f));
      removed.push(f);
    }
  }
  return removed;
}
