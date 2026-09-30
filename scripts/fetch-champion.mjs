// Tải dữ liệu + ảnh tướng từ trang chính thức Tốc Chiến (vi-vn).
//
//   node scripts/fetch-champion.mjs samira tristana draven
//   node scripts/fetch-champion.mjs samira --force      (tải lại dù đã có)
//
// Kết quả:
//   data/champions/<slug>.json
//   assets/champions/<slug>/portrait.jpg | splash.jpg | skill-p.jpg | skill-q.jpg | skill-w.jpg | skill-e.jpg | skill-r.jpg

import { mkdir, writeFile, readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'https://wildrift.leagueoflegends.com';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) meta-wildrift/1.0';

// Tốc Chiến ghi ô kỹ năng là NỘI TẠI / 1 / 2 / 3 / CHIÊU CUỐI → đổi sang P/Q/W/E/R cho quen tay.
const SLOT_KEY = { 'NỘI TẠI': 'p', '1': 'q', '2': 'w', '3': 'e', 'CHIÊU CUỐI': 'r' };
const SLOT_LABEL = { p: 'NỘI TẠI', q: 'Q', w: 'W', e: 'E', r: 'R' };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const exists = (p) => access(p).then(() => true, () => false);

async function getNextData(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const html = await res.text();
  const m = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (!m) throw new Error(`Không thấy __NEXT_DATA__ ở ${url}`);
  return JSON.parse(m[1]).props.pageProps.page;
}

async function download(url, dest, { force }) {
  if (!force && (await exists(dest))) return 'skip';
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  await writeFile(dest, Buffer.from(await res.arrayBuffer()));
  await sleep(300);
  return 'ok';
}

// Sanity CDN hỗ trợ tham số resize/định dạng.
const sanity = (url, params = '') => url.split('?')[0] + '?accountingTag=WR' + params;

let indexCache;
async function championIndex() {
  if (!indexCache) {
    const page = await getNextData(`${BASE}/vi-vn/champions/`);
    const grid = page.blades.find((b) => b.type === 'characterCardGrid');
    indexCache = new Map(
      grid.items.map((it) => {
        const slug = it.action.payload.url.split('/').filter(Boolean).pop();
        return [slug, { name: it.title, portrait: it.media.url, colors: it.media.colors }];
      }),
    );
  }
  return indexCache;
}

async function fetchChampion(slug, opts) {
  const idx = await championIndex();
  const card = idx.get(slug);
  if (!card) throw new Error(`Không có tướng "${slug}" trên trang Tốc Chiến`);

  const page = await getNextData(`${BASE}/vi-vn/champions/${slug}/`);
  const head = page.blades.find((b) => b.type === 'characterMasthead');
  const tab = page.blades.find((b) => b.type === 'iconTab');
  const skins = page.blades.find((b) => b.type === 'landingMediaCarousel');

  const dir = path.join(ROOT, 'assets', 'champions', slug);
  await mkdir(dir, { recursive: true });
  const rel = (f) => `assets/champions/${slug}/${f}`;

  await download(sanity(card.portrait), path.join(dir, 'portrait.jpg'), opts);

  const skin = skins?.groups?.[0];
  if (skin) await download(sanity(skin.thumbnail.url), path.join(dir, 'splash.jpg'), opts);

  const skills = [];
  for (const g of tab?.groups ?? []) {
    const key = SLOT_KEY[g.content.subtitle?.trim().toUpperCase()] ?? g.content.subtitle;
    const file = `skill-${key}.jpg`;
    await download(sanity(g.thumbnail.url), path.join(dir, file), opts);
    skills.push({
      key,
      slot: SLOT_LABEL[key] ?? key,
      name: g.content.title,
      icon: rel(file),
      description: g.content.description?.body?.replace(/<[^>]+>/g, '').trim() ?? '',
    });
  }

  // Giữ lại phần chỉnh tay (vị trí cắt splash...) nếu file đã tồn tại.
  const jsonPath = path.join(ROOT, 'data', 'champions', `${slug}.json`);
  const old = await readFile(jsonPath, 'utf8').then(JSON.parse, () => ({}));

  const data = {
    slug,
    name: head?.title ?? card.name,
    title: head?.subtitle ?? '',
    roles: head?.role?.roles?.map((r) => r.name) ?? [],
    difficulty: head?.difficulty?.value ?? null,
    colors: skin?.thumbnail?.colors ?? card.colors,
    portrait: rel('portrait.jpg'),
    splash: skin ? rel('splash.jpg') : rel('portrait.jpg'),
    splashName: skin?.label ?? '',
    skills,
    // layout.splashPosition / layout.splashSize: căn khung splash trên ảnh chi tiết (sửa tay).
    layout: old.layout ?? { splashPosition: '50% 20%', splashSize: 'auto 100%' },
    source: `${BASE}/vi-vn/champions/${slug}/`,
    syncedAt: new Date().toISOString().slice(0, 10),
  };
  await writeFile(jsonPath, JSON.stringify(data, null, 2) + '\n');
  return data;
}

const args = process.argv.slice(2);
const opts = { force: args.includes('--force') };
const slugs = args.filter((a) => !a.startsWith('--'));
if (!slugs.length) {
  console.log('Cách dùng: node scripts/fetch-champion.mjs <slug> [slug...] [--force]');
  process.exit(1);
}
await mkdir(path.join(ROOT, 'data', 'champions'), { recursive: true });
for (const slug of slugs) {
  try {
    const c = await fetchChampion(slug, opts);
    console.log(`✔ ${c.name.padEnd(14)} ${c.title} · ${c.skills.map((s) => `${s.slot}:${s.name}`).join(' | ')}`);
  } catch (err) {
    console.error(`✘ ${slug}: ${err.message}`);
    process.exitCode = 1;
  }
}
