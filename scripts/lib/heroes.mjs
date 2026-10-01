// Danh sách tướng: tên tiếng Trung (máy chủ CN) ↔ slug của dự án (trang vi-vn).
// Ghép theo tên file poster của máy chủ CN (vd Posters/Singed_0.jpg) với danh sách tướng trang vi-vn.
// Dùng chung cho cn-hero.mjs và tierlist.mjs.
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { ROOT } from './patches.mjs';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) meta-wildrift/1.0';
const CN_LIST = 'https://game.gtimg.cn/images/lgamem/act/lrlib/js/heroList/hero_list.js';
const VI_LIST = 'https://wildrift.leagueoflegends.com/vi-vn/champions/';
// Tên trên máy chủ CN khác slug vi-vn (giống CN_ALIAS trong fetch-champion.mjs).
const ALIAS = { monkeyking: 'wukong', nunu: 'nunu-and-willump' };

// Bản sao danh sách lần tải gần nhất — dùng khi mất mạng.
const CACHE = path.join(ROOT, 'data', 'cn-heroes.json');

const key = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
async function get(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res;
}

async function download() {
  const { heroList } = await (await get(CN_LIST)).json();
  const html = await (await get(VI_LIST)).text();
  const page = JSON.parse(html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/)[1]).props.pageProps.page;
  const vi = new Map(
    page.blades.find((b) => b.type === 'characterCardGrid').items.map((it) => {
      const slug = it.action.payload.url.split('/').filter(Boolean).pop();
      return [key(slug), { slug, name: it.title }];
    }),
  );
  return Object.values(heroList).filter((h) => h.poster).map((h) => {
    const en = h.poster.split('/').pop().replace(/_\d+\.\w+$/, '');
    const k = key(en);
    const match = vi.get(key(ALIAS[k] ?? k));
    return { cn: h.name, en, slug: match?.slug ?? null, vi: match?.name ?? null };
  });
}

let heroesPromise;
// [{ cn, en, slug, vi }] — slug/vi = null nếu tướng chưa có trên trang vi-vn
export function loadHeroes() {
  heroesPromise ??= download().then(
    async (heroes) => {
      await writeFile(CACHE, JSON.stringify(heroes, null, 1) + '\n').catch(() => {});
      return heroes;
    },
    async (err) => {
      const cached = await readFile(CACHE, 'utf8').then(JSON.parse, () => null);
      if (!cached) throw new Error(`Không tải được danh sách tướng (${err.message}) và chưa có bản sao data/cn-heroes.json`);
      console.warn(`⚠ Không tải được danh sách tướng (${err.message}) — dùng bản sao data/cn-heroes.json (tướng mới ra có thể chưa có)`);
      return cached;
    },
  );
  return heroesPromise;
}

// Tên tiếng Trung, tên tiếng Anh hoặc slug → { cn, en, slug, vi } | null
export async function findHero(name) {
  const heroes = await loadHeroes();
  const k = key(name);
  return heroes.find((h) => h.cn === name) ?? heroes.find((h) => h.slug === name || (k && (key(h.en) === k || key(h.slug ?? '') === k))) ?? null;
}

// Tình trạng dữ liệu trong dự án: 'missing' | 'no-face' | 'ok'
export async function localStatus(slug) {
  const champ = await readFile(path.join(ROOT, 'data', 'champions', `${slug}.json`), 'utf8').then(JSON.parse, () => null);
  if (!champ) return 'missing';
  return champ.layout?.face ? 'ok' : 'no-face';
}
export const STATUS_TEXT = {
  missing: 'CHƯA CÓ dữ liệu → fetch-champion.mjs',
  'no-face': 'đã có dữ liệu · chưa đo khuôn mặt → splash-grid.mjs --face',
  ok: 'đã có dữ liệu + khuôn mặt',
};
