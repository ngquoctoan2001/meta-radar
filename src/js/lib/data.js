// Tải dữ liệu JSON (chạy qua server, đường dẫn tính từ gốc dự án).
import { collectionKind, collectionFile } from './collections.js';

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
export const loadPatch = (id) => getJSON(`/${collectionFile(encodeURIComponent(id))}`);
export const loadTierlist = loadPatch;
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
  return { brand, patch, champions, items, slides: patch.slides };
}

const loadChampions = async (slugs) =>
  Object.fromEntries(await Promise.all([...new Set(slugs)].map(async (slug) => [slug, await loadChampion(slug)])));

// Tier list: tướng ở mọi đường + bản cập nhật liên quan (để gắn nhãn BUFF/NERF) + tier list trước (để so lên/xuống hạng).
export async function loadTierlistBundle(id) {
  const [brand, tierlist] = await Promise.all([loadBrand(), loadTierlist(id)]);
  const [patch, previous, champions] = await Promise.all([
    tierlist.patch ? loadPatch(tierlist.patch) : null,
    tierlist.previous ? loadTierlist(tierlist.previous) : null,
    loadChampions(tierlist.lanes.flatMap((l) => l.champions.map((c) => c.slug))),
  ]);
  return { brand, tierlist, patch, previous, champions, slides: tierlist.slides };
}

// Build: tướng + trang bị trong các build + ngọc/phép bổ trợ + tướng đối đầu / hỗ trợ hợp (avatar)
// + tier list (bậc, tỉ lệ thắng).
export async function loadBuildBundle(id) {
  const [brand, build, runeData] = await Promise.all([loadBrand(), loadPatch(id), getJSON('/data/runes.json')]);
  const slugs = [...new Set(build.builds.flatMap((b) => b.items))];
  const m = build.matchups ?? {};
  const [champion, tierlist, items, champions] = await Promise.all([
    loadChampion(build.champion),
    build.tierlist ? loadPatch(build.tierlist) : null,
    Promise.all(slugs.map(async (s) => [s, await loadItem(s)])).then(Object.fromEntries),
    loadChampions([...(m.strong ?? []), ...(m.weak ?? []), ...(m.synergy ?? [])]),
  ]);
  const runes = Object.fromEntries(runeData.runes.map((r) => [r.id, r]));
  const spells = Object.fromEntries(runeData.spells.map((s) => [s.key, s]));
  return { brand, build, champion, tierlist, items, runes, spells, champions, slides: build.slides };
}

const LOADERS = { patch: loadPatchBundle, tierlist: loadTierlistBundle, build: loadBuildBundle };
export const loadBundle = (id) => LOADERS[collectionKind(id)](id);
