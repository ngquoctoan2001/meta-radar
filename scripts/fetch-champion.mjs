// Tải dữ liệu + ảnh tướng.
//
//   node scripts/fetch-champion.mjs samira tristana draven
//
// Nguồn:
//   - Trang chính thức Tốc Chiến vi-vn: tên, danh hiệu, vai trò, tên kỹ năng tiếng Việt, ảnh chân dung,
//     splash 1280×720, icon kỹ năng 96px.
//   - Dữ liệu Tốc Chiến máy chủ Trung Quốc (game.gtimg.cn): cùng tranh vẽ nhưng thường nét hơn —
//     splash tới 2436×1124, icon kỹ năng 128px PNG.
//   Với splash và từng icon, script tự chọn bản có độ phân giải cao hơn.
//
// Kết quả:
//   data/champions/<slug>.json
//   assets/champions/<slug>/portrait.jpg | splash.jpg | skill-p|q|w|e|r.(png|jpg)

import { mkdir, writeFile, readFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'https://wildrift.leagueoflegends.com';
const CN = 'https://game.gtimg.cn/images/lgamem/act/lrlib';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) meta-wildrift/1.0';

// Tốc Chiến ghi ô kỹ năng là NỘI TẠI / 1 / 2 / 3 / CHIÊU CUỐI → đổi sang P/Q/W/E/R cho quen tay.
const SLOT_KEY = { 'NỘI TẠI': 'p', '1': 'q', '2': 'w', '3': 'e', 'CHIÊU CUỐI': 'r', PASSIVE: 'p', ULTIMATE: 'r' };
// Trang vi-vn ghi sai tên (vd Vladimir hiện là "ĐỎ") → tên đúng ghi tay ở đây.
const NAME_FIX = { vladimir: 'VLADIMIR' };
// Trang chi tiết vi-vn của vài tướng mới bị lỗi 404 (vd Aurora) dù tướng có trong danh sách → lấy tạm trang tiếng Anh
// (tên kỹ năng, danh hiệu, vai trò sẽ là tiếng Anh; ghi "pageLocale" để biết mà tải lại sau).
const PAGE_LOCALES = ['vi-vn', 'en-us'];
const SLOT_LABEL = { p: 'NỘI TẠI', q: 'Q', w: 'W', e: 'E', r: 'R' };
// Tên trên máy chủ CN khác slug vi-vn.
const CN_ALIAS = { wukong: 'monkeyking', 'nunu-and-willump': 'nunu' };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const key = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

async function get(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  await sleep(200);
  return res;
}
const getBuffer = async (url) => Buffer.from(await (await get(url)).arrayBuffer());

async function getNextData(url) {
  const html = await (await get(url)).text();
  const m = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (!m) throw new Error(`Không thấy __NEXT_DATA__ ở ${url}`);
  return JSON.parse(m[1]).props.pageProps.page;
}

// Kích thước ảnh PNG / JPEG đọc từ phần đầu file (không cần thư viện).
function imageSize(buf) {
  if (buf.readUInt32BE(0) === 0x89504e47) return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20), ext: 'png' };
  for (let i = 2; i + 9 < buf.length; ) {
    if (buf[i] !== 0xff) { i++; continue; }
    const m = buf[i + 1];
    if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) {
      return { width: buf.readUInt16BE(i + 7), height: buf.readUInt16BE(i + 5), ext: 'jpg' };
    }
    i += 2 + buf.readUInt16BE(i + 2);
  }
  return { width: 0, height: 0, ext: 'jpg' };
}

// Tải các ứng viên, giữ bản rộng nhất (null/lỗi bị bỏ qua).
async function pickLargest(candidates) {
  let best = null;
  for (const c of candidates.filter(Boolean)) {
    try {
      const buf = await getBuffer(c.url);
      const size = imageSize(buf);
      if (!best || size.width > best.width) best = { ...c, buf, ...size };
    } catch (err) {
      console.warn(`  ⚠ bỏ qua ${c.url}: ${err.message}`);
    }
  }
  return best;
}

// Sanity CDN (trang vi-vn): bỏ tham số resize để lấy ảnh gốc.
const sanity = (url) => url.split('?')[0] + '?accountingTag=WR';

let wrIndex;
async function wildRiftIndex() {
  if (!wrIndex) {
    const page = await getNextData(`${BASE}/vi-vn/champions/`);
    const grid = page.blades.find((b) => b.type === 'characterCardGrid');
    wrIndex = new Map(
      grid.items.map((it) => {
        const slug = it.action.payload.url.split('/').filter(Boolean).pop();
        return [slug, { name: it.title, portrait: it.media.url, colors: it.media.colors }];
      }),
    );
  }
  return wrIndex;
}

// Danh sách tướng máy chủ CN, tra theo tên tiếng Anh lấy từ tên file poster (vd Posters/Samira_0.jpg).
let cnIndex;
async function chinaIndex() {
  if (!cnIndex) {
    const { heroList } = await (await get(`${CN}/js/heroList/hero_list.js`)).json();
    cnIndex = new Map(
      Object.values(heroList)
        .filter((h) => h.poster)
        .map((h) => [key(h.poster.split('/').pop().replace(/_\d+\.\w+$/, '')), h]),
    );
  }
  return cnIndex;
}

async function chinaHero(slug) {
  try {
    const hero = (await chinaIndex()).get(CN_ALIAS[slug] ?? key(slug));
    if (!hero) return null;
    const { spells } = await (await get(`${CN}/js/hero/${hero.heroId}.js`)).json();
    // Tên file icon không đồng nhất (_P, _passive, _Icon_Q, _Q_new…) nhưng thứ tự luôn là:
    // nội tại (spellKey "passive") rồi 4 kỹ năng Q, W, E, R. Tướng có nhiều hơn 4 kỹ năng (vd Hwei) → bỏ qua.
    const passive = spells.find((s) => s.spellKey === 'passive');
    const actives = spells.filter((s) => s.spellKey !== 'passive');
    const icons = {};
    if (passive) icons.p = passive.abilityIconPath;
    if (actives.length === 4) ['q', 'w', 'e', 'r'].forEach((k, i) => (icons[k] = actives[i].abilityIconPath));
    return { poster: hero.poster, icons };
  } catch (err) {
    console.warn(`  ⚠ không lấy được dữ liệu CN cho ${slug}: ${err.message}`);
    return null;
  }
}

async function save(dir, base, img) {
  // xoá bản cũ khác đuôi (vd skill-p.jpg khi bản mới là skill-p.png)
  for (const ext of ['jpg', 'png']) if (ext !== img.ext) await unlink(path.join(dir, `${base}.${ext}`)).catch(() => {});
  await writeFile(path.join(dir, `${base}.${img.ext}`), img.buf);
  return `${base}.${img.ext}`;
}

async function fetchChampion(slug) {
  const card = (await wildRiftIndex()).get(slug);
  if (!card) throw new Error(`Không có tướng "${slug}" trên trang Tốc Chiến`);

  let page, pageLocale;
  for (const locale of PAGE_LOCALES) {
    try {
      page = await getNextData(`${BASE}/${locale}/champions/${slug}/`);
      pageLocale = locale;
      break;
    } catch (err) {
      if (locale === PAGE_LOCALES.at(-1)) throw err;
      console.warn(`  ⚠ ${slug}: trang ${locale} lỗi (${err.message.split(' ')[0]}) — thử trang ${PAGE_LOCALES[PAGE_LOCALES.indexOf(locale) + 1]}`);
    }
  }
  if (pageLocale !== 'vi-vn') console.warn(`  ⚠ ${slug}: dùng trang ${pageLocale} — tên kỹ năng / danh hiệu / vai trò là tiếng Anh, tải lại khi trang vi-vn có`);
  const head = page.blades.find((b) => b.type === 'characterMasthead');
  const tab = page.blades.find((b) => b.type === 'iconTab');
  const skin = page.blades.find((b) => b.type === 'landingMediaCarousel')?.groups?.[0];
  const cn = await chinaHero(slug);

  const dir = path.join(ROOT, 'assets', 'champions', slug);
  await mkdir(dir, { recursive: true });
  const rel = (f) => `assets/champions/${slug}/${f}`;

  await writeFile(path.join(dir, 'portrait.jpg'), await getBuffer(sanity(card.portrait)));

  const splash = await pickLargest([
    skin && { url: sanity(skin.thumbnail.url), source: 'wildrift.leagueoflegends.com' },
    cn && { url: cn.poster, source: 'game.gtimg.cn' },
  ]);
  if (splash) splash.ext = 'jpg';
  const splashFile = splash ? await save(dir, 'splash', splash) : null;

  const skills = [];
  for (const g of tab?.groups ?? []) {
    const k = SLOT_KEY[g.content.subtitle?.trim().toUpperCase()] ?? g.content.subtitle;
    const icon = await pickLargest([
      { url: sanity(g.thumbnail.url), source: 'wildrift.leagueoflegends.com' },
      cn?.icons[k] && { url: cn.icons[k], source: 'game.gtimg.cn' },
    ]);
    skills.push({
      key: k,
      slot: SLOT_LABEL[k] ?? k,
      name: g.content.title,
      icon: icon ? rel(await save(dir, `skill-${k}`, icon)) : '',
      iconSize: icon?.width ?? null,
      description: g.content.description?.body?.replace(/<[^>]+>/g, '').trim() ?? '',
    });
  }

  // Giữ lại phần chỉnh tay (layout.focusX) nếu file đã tồn tại.
  const jsonPath = path.join(ROOT, 'data', 'champions', `${slug}.json`);
  const old = await readFile(jsonPath, 'utf8').then(JSON.parse, () => ({}));

  const data = {
    slug,
    name: NAME_FIX[slug] ?? head?.title ?? card.name,
    title: head?.subtitle ?? '',
    ...(pageLocale !== 'vi-vn' ? { pageLocale } : {}),
    roles: head?.role?.roles?.map((r) => r.name) ?? [],
    difficulty: head?.difficulty?.value ?? null,
    colors: skin?.thumbnail?.colors ?? card.colors,
    portrait: rel('portrait.jpg'),
    splash: splashFile ? rel(splashFile) : rel('portrait.jpg'),
    splashDims: splash ? { width: splash.width, height: splash.height } : null,
    splashSource: splash?.source ?? null,
    splashName: skin?.label ?? '',
    skills,
    // layout.focusX: vị trí ngang khuôn mặt tướng trong splash (0 = trái, 1 = phải) — sửa tay, dùng để căn khung.
    layout: old.layout ?? { focusX: 0.5 },
    source: `${BASE}/${pageLocale}/champions/${slug}/`,
    syncedAt: new Date().toISOString().slice(0, 10),
  };
  await writeFile(jsonPath, JSON.stringify(data, null, 2) + '\n');
  return data;
}

const slugs = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (!slugs.length) {
  console.log('Cách dùng: node scripts/fetch-champion.mjs <slug> [slug...]');
  process.exit(1);
}
await mkdir(path.join(ROOT, 'data', 'champions'), { recursive: true });
for (const slug of slugs) {
  try {
    const c = await fetchChampion(slug);
    const icons = [...new Set(c.skills.map((s) => s.iconSize))].join('/');
    console.log(`✔ ${c.name.padEnd(9)} splash ${c.splashDims?.width}×${c.splashDims?.height} (${c.splashSource}) · icon ${icons}px`);
  } catch (err) {
    console.error(`✘ ${slug}: ${err.message}`);
    process.exitCode = 1;
  }
}
