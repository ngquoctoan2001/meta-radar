// Ba loại bộ ảnh, dùng chung mã nhận dạng (id) trong URL, API và tên file ảnh xuất:
//   bản cập nhật  patches/<id>/patch.json             id kiểu 7.3a
//   tier list     tierlists/<id>/tierlist.json         id bắt đầu bằng "tier-", vd tier-2026-09-30
//   build         builds/<id>/build.json               id bắt đầu bằng "build-", vd build-ashe-2026-10-01
// Dùng được cả ở trình duyệt lẫn Node (không import gì).

const KINDS = {
  patch: { dir: 'patches', file: 'patch.json' },
  tierlist: { dir: 'tierlists', file: 'tierlist.json', prefix: 'tier-' },
  build: { dir: 'builds', file: 'build.json', prefix: 'build-' },
};

export const collectionKind = (id) =>
  Object.entries(KINDS).find(([, k]) => k.prefix && String(id).startsWith(k.prefix))?.[0] ?? 'patch';
export const isTierlist = (id) => collectionKind(id) === 'tierlist';
export const isBuild = (id) => collectionKind(id) === 'build';
export const collectionDir = (id) => `${KINDS[collectionKind(id)].dir}/${id}`;
export const collectionFile = (id) => `${collectionDir(id)}/${KINDS[collectionKind(id)].file}`;
