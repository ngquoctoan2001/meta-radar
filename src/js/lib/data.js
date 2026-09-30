// Tải dữ liệu JSON (chạy qua server, đường dẫn tính từ gốc dự án).
const cache = new Map();

async function getJSON(url) {
  if (!cache.has(url)) {
    cache.set(url, fetch(url, { cache: 'no-store' }).then((r) => {
      if (!r.ok) throw new Error(`Không tải được ${url} (${r.status})`);
      return r.json();
    }));
  }
  return cache.get(url);
}

export const loadBrand = () => getJSON('/data/brand.json');
export const loadPatch = (id) => getJSON(`/patches/${encodeURIComponent(id)}/patch.json`);
export const loadChampion = (slug) => getJSON(`/data/champions/${slug}.json`);
export const loadItem = (slug) => getJSON(`/data/items/${slug}.json`);

// Gom toàn bộ dữ liệu cần cho 1 patch: tướng + trang bị được nhắc tới.
export async function loadPatchBundle(id) {
  const [brand, patch] = await Promise.all([loadBrand(), loadPatch(id)]);
  const champions = Object.fromEntries(
    await Promise.all(patch.champions.map(async (c) => [c.slug, await loadChampion(c.slug)])),
  );
  const items = Object.fromEntries(
    await Promise.all((patch.items ?? []).map(async (it) => [it.slug, await loadItem(it.slug)])),
  );
  return { brand, patch, champions, items };
}
