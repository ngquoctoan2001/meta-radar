// Hai loại bộ ảnh, dùng chung mã nhận dạng (id) trong URL, API và tên file ảnh xuất:
//   bản cập nhật  patches/<id>/patch.json             id kiểu 7.3a
//   tier list     tierlists/<id>/tierlist.json         id bắt đầu bằng "tier-", vd tier-2026-09-30
// Dùng được cả ở trình duyệt lẫn Node (không import gì).

export const isTierlist = (id) => String(id).startsWith('tier-');
export const collectionKind = (id) => (isTierlist(id) ? 'tierlist' : 'patch');
export const collectionDir = (id) => (isTierlist(id) ? `tierlists/${id}` : `patches/${id}`);
export const collectionFile = (id) => `${collectionDir(id)}/${isTierlist(id) ? 'tierlist' : 'patch'}.json`;
