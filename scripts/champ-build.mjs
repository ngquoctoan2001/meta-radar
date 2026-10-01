// Đọc ảnh build của cao thủ (popup "<tướng> 主模式" trong bảng xếp hạng Tốc Chiến Trung Quốc) → dữ liệu build.
//
//   node scripts/champ-build.mjs read <ảnh> [ảnh…]
//        nhận diện 2 phép bổ trợ, 5 ngọc, 6 trang bị trong mỗi ảnh bằng cách so với icon chính thức
//        (máy chủ CN) → in kết quả + độ chắc chắn, vẽ ảnh soát review/build-read.png
//
//   node scripts/champ-build.mjs new <tướng> <yyyy-mm-dd> top1=<ảnh> top3=<ảnh> top4=<ảnh> [tip=<ảnh tooltip>…] [--role=adc] [--replace]
//        Thêm 1 tướng vào BỘ BUILD của ngày + vai trò: builds/build-<ngày>-<vai trò>/build.json
//        (vd build-2026-10-01-adc — trang quản lý hiện 1 mục "01/10 · Build ADC" chứa mọi tướng của bộ, mỗi tướng 1 ảnh).
//        <tướng>: tên tiếng Trung trong ảnh (艾希), tên tiếng Anh hoặc slug.
//        top<N>=<ảnh>: ảnh build của cao thủ hạng N (排位: N) — build xếp theo hạng tăng dần (BUILD 1 = hạng cao nhất).
//        tip=<ảnh>: ảnh tooltip trang bị — chỉ chép vào source/<tướng>/ để lưu.
//        --role: adc | top | jungle | mid | sp (mặc định: đường có tỉ lệ chọn cao nhất trong tier list). --lane=… vẫn dùng được.
//        --replace: tướng đã có trong bộ → ghi đè build (giữ 9 tướng đối đầu đã viết).
//        Tự tải tướng / trang bị còn thiếu, giày luôn ở ô 6 và đồng bộ giữa 3 build, báo ảnh trùng ảnh đã dùng.
//        Tên build, "hợp", "khắc chế" và 9 tướng đối đầu để trống cho bạn viết.
//
// Ảnh chụp ở máy khác độ phân giải vẫn đọc được: vị trí icon tính theo chiều cao ảnh, lấy giữa ảnh làm gốc.
import { readFile, writeFile, mkdir, copyFile, readdir, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { ROOT } from './lib/patches.mjs';
import { getBrowser, closeBrowser } from './lib/renderer.mjs';
import { findHero } from './lib/heroes.mjs';
import { parseISO, pickPatch, pickTierlist } from './lib/pick.mjs';
import { ROLES, roleOfLane, titleCase } from '../src/js/lib/roles.js';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) meta-wildrift/1.0';
const CN_EQUIP = 'https://game.gtimg.cn/images/lgamem/act/lrlib/js/equip/equip.js';
const DD = 'https://ddragon.leagueoflegends.com';
const CACHE = path.join(ROOT, 'review', '.icons');
const SOURCE = 'Bảng xếp hạng Tốc Chiến Trung Quốc';

// Vị trí icon đo trên ảnh 2000×900: (x − giữa ảnh) / chiều cao, y / chiều cao, cạnh / chiều cao.
const at = (x, y, s) => ({ dx: (x - 1000) / 900, dy: y / 900, s: s / 900 });
const SLOTS = [
  ...[1100, 1189].map((x, i) => ({ kind: 'spell', i, ...at(x, 275, 66) })),
  ...[1100, 1185, 1269, 1353, 1437].map((x, i) => ({ kind: i ? 'rune' : 'keystone', i, ...at(x, 425, 74) })),
  ...[1099, 1187, 1274, 1362, 1449, 1537].map((x, i) => ({ kind: 'item', i, ...at(x, 575, 68) })),
];
// Ngưỡng tin cậy (khoảng cách màu RMS, càng nhỏ càng giống): xa hơn / sát món thứ 2 quá → cần soát bằng mắt.
const MAX_DIST = 50;
// Ngọc chính trong game có khung trang trí (vòng nguyệt quế…) nên luôn lệch hơn icon gốc.
const MAX_DIST_KEYSTONE = 72;
const MIN_GAP = 8;

const fail = (msg) => { console.error(`✘ ${msg}`); process.exit(1); };
const tryJSON = (p) => readFile(path.join(ROOT, p), 'utf8').then(JSON.parse, () => null);
const exists = (p) => stat(p).then(() => true, () => false);
async function get(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res;
}
const dataUrl = async (file) => `data:image/${file.endsWith('.png') ? 'png' : 'jpeg'};base64,${(await readFile(file)).toString('base64')}`;

// ---------- danh mục icon để so ----------
async function catalogs() {
  const runeData = await tryJSON('data/runes.json');
  if (!runeData) fail('Chưa có data/runes.json — chạy: node scripts/fetch-runes.mjs');
  const { equipList } = await (await get(CN_EQUIP)).json();
  await mkdir(CACHE, { recursive: true });
  const items = [];
  for (const e of equipList) {
    if (!e.iconPath) continue;
    const file = path.join(CACHE, `equip-${e.equipId}.png`);
    if (!(await exists(file))) {
      try { await writeFile(file, Buffer.from(await (await get(e.iconPath)).arrayBuffer())); } catch { continue; }
    }
    items.push({ id: e.equipId, name: e.name, src: await dataUrl(file) });
  }
  const runes = [];
  for (const r of runeData.runes) runes.push({ id: r.id, name: r.cn, keystone: r.type === 'keystone', src: await dataUrl(path.join(ROOT, r.icon)) });
  const spells = [];
  for (const s of runeData.spells) spells.push({ id: s.key, name: s.cn, src: await dataUrl(path.join(ROOT, s.icon)) });
  return { items, runes, spells, runeData, equipList };
}

// ---------- so icon trong trình duyệt (canvas) ----------
async function matchAll(files, cat, sheetPath) {
  const browser = await getBrowser();
  const page = await browser.newPage({ viewport: { width: 1400, height: 400 } });
  try {
    const shots = [];
    for (const f of files) shots.push({ name: path.basename(f), src: await dataUrl(f) });
    return await page.evaluate(async ({ shots, cat, SLOTS, MAX_DIST, MAX_DIST_KEYSTONE, MIN_GAP, sheet }) => {
      const load = (src) => new Promise((ok, err) => { const i = new Image(); i.onload = () => ok(i); i.onerror = err; i.src = src; });
      const S = 48;
      const cv = document.createElement('canvas');
      cv.width = cv.height = S;
      const g = cv.getContext('2d', { willReadFrequently: true });
      g.imageSmoothingQuality = 'high';
      const c = (S - 1) / 2;
      const MASK = {
        item: (x, y) => y < S * 0.72, // badge N / ↻ ở đáy icon
        spell: () => true,
        rune: (x, y) => (x - c) ** 2 + (y - c) ** 2 <= (S * 0.36) ** 2,
        keystone: (x, y) => (x - c) ** 2 + (y - c) ** 2 <= (S * 0.36) ** 2 && y < S * 0.66,
      };
      const feat = (img, sx, sy, sw, sh, mask) => {
        g.fillStyle = 'rgb(12,14,30)';
        g.fillRect(0, 0, S, S);
        g.drawImage(img, sx, sy, sw, sh, 0, 0, S, S);
        const d = g.getImageData(0, 0, S, S).data;
        const out = [];
        for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) if (mask(x, y)) { const k = (y * S + x) * 4; out.push(d[k], d[k + 1], d[k + 2]); }
        return out;
      };
      const dist = (a, b) => { let t = 0; for (let k = 0; k < a.length; k++) t += (a[k] - b[k]) ** 2; return Math.sqrt(t / a.length); };
      const lib = {};
      for (const kind of ['item', 'spell', 'rune', 'keystone']) {
        const list = kind === 'item' ? cat.items : kind === 'spell' ? cat.spells : cat.runes.filter((r) => (kind === 'keystone') === r.keystone);
        lib[kind] = [];
        for (const e of list) {
          const img = await load(e.src);
          lib[kind].push({ id: e.id, name: e.name, src: e.src, f: feat(img, 0, 0, img.naturalWidth, img.naturalHeight, MASK[kind]) });
        }
      }
      const results = [];
      const rows = [];
      for (const shot of shots) {
        const img = await load(shot.src);
        const W = img.naturalWidth, H = img.naturalHeight;
        const slots = [];
        const cells = [];
        for (const sl of SLOTS) {
          const size = sl.s * H, cx = W / 2 + sl.dx * H, cy = sl.dy * H;
          const f = feat(img, cx - size / 2, cy - size / 2, size, size, MASK[sl.kind]);
          const ranked = lib[sl.kind].map((e) => ({ id: e.id, name: e.name, src: e.src, d: dist(f, e.f) })).sort((a, b) => a.d - b.d);
          const [best, second] = ranked;
          const sure = best.d <= (sl.kind === 'keystone' ? MAX_DIST_KEYSTONE : MAX_DIST) && second.d - best.d >= MIN_GAP;
          slots.push({ kind: sl.kind, i: sl.i, id: best.id, name: best.name, d: +best.d.toFixed(1), gap: +(second.d - best.d).toFixed(1), alt: second.name, sure });
          const crop = document.createElement('canvas');
          crop.width = crop.height = 72;
          crop.getContext('2d').drawImage(img, cx - size / 2, cy - size / 2, size, size, 0, 0, 72, 72);
          cells.push(`<div class="cell ${sure ? '' : 'warn'}"><img src="${crop.toDataURL()}"><img src="${best.src}"><small>${best.name}<br>${best.d.toFixed(0)} · ±${(second.d - best.d).toFixed(0)}</small></div>`);
        }
        results.push({ name: shot.name, slots });
        rows.push(`<h2>${shot.name}</h2><div class="row">${cells.join('')}</div>`);
      }
      if (sheet) {
        document.body.innerHTML = `<style>
          body{margin:0;padding:16px;background:#0b0b14;color:#ddd;font:13px/1.3 'Microsoft YaHei','Segoe UI',sans-serif}
          h2{margin:14px 0 6px;font-size:15px}.row{display:flex;flex-wrap:wrap;gap:8px}
          .cell{width:150px;padding:6px;border:2px solid #2a2a3a;border-radius:8px;display:grid;grid-template-columns:72px 72px;gap:4px}
          .cell img{width:72px;height:72px;background:#111}.cell small{grid-column:1/-1;color:#aaa}
          .cell.warn{border-color:#ff3d6e}.cell.warn small{color:#ff8fa8}
        </style>${rows.join('')}`;
      }
      return results;
    }, { shots, cat: { items: cat.items, runes: cat.runes, spells: cat.spells }, SLOTS, MAX_DIST, MAX_DIST_KEYSTONE, MIN_GAP, sheet: !!sheetPath });
  } finally {
    if (sheetPath) {
      await mkdir(path.dirname(sheetPath), { recursive: true });
      await page.screenshot({ path: sheetPath, fullPage: true }).catch(() => {});
    }
    await page.close();
  }
}

function printResult(r) {
  console.log(`\n== ${r.name}`);
  const line = (kind, label) => {
    const s = r.slots.filter((x) => x.kind === kind || (kind === 'rune' && x.kind === 'keystone'));
    console.log(`  ${label.padEnd(9)} ${s.map((x) => `${x.sure ? '' : '⚠'}${x.name}`).join(' · ')}`);
    for (const x of s.filter((y) => !y.sure)) console.log(`     ⚠ ô ${label} ${x.i + 1}: ${x.name} (lệch ${x.d}, gần với "${x.alt}" ±${x.gap}) — mở ảnh soát để kiểm`);
  };
  line('spell', 'phép');
  line('rune', 'ngọc');
  line('item', 'trang bị');
}

// ---------- trang bị: mã CN → slug trong data/items (tải món còn thiếu) ----------
async function itemIndex() {
  const map = new Map();
  for (const f of await readdir(path.join(ROOT, 'data', 'items'))) {
    const j = await tryJSON(`data/items/${f}`);
    const id = j?.cnId ?? j?.source?.match(/mã (\d+)/)?.[1];
    if (id) map.set(String(id), j);
  }
  return map;
}
let ddNames;
async function englishName(cnName) {
  if (!ddNames) {
    const v = (await (await get(`${DD}/api/versions.json`)).json())[0];
    const [zh, en] = await Promise.all(['zh_CN', 'en_US'].map(async (l) => (await (await get(`${DD}/cdn/${v}/data/${l}/item.json`)).json()).data));
    ddNames = new Map(Object.entries(zh).map(([id, it]) => [it.name, en[id]?.name]));
  }
  return ddNames.get(cnName) ?? null;
}
const isBoots = (it) => !!it && (it.tags?.includes('Giày') || /greaves|boots|treads|steelcaps|shoes/i.test(it.name ?? '') || /靴|胫甲|鞋/.test(it.cnName ?? ''));
const node = (...args) => execFileSync(process.execPath, args, { cwd: ROOT, stdio: 'inherit' });

// Ảnh trùng ảnh gốc của build đã làm (so nội dung file) → [{ img, id, file }]
const md5 = async (f) => createHash('md5').update(await readFile(f)).digest('hex');
async function findDuplicates(files) {
  const known = new Map();
  for (const d of await readdir(path.join(ROOT, 'builds'), { withFileTypes: true }).catch(() => [])) {
    if (!d.isDirectory()) continue;
    const src = path.join(ROOT, 'builds', d.name, 'source');
    for (const f of await readdir(src, { recursive: true }).catch(() => [])) {
      if (/\.(jpe?g|png|webp)$/i.test(f)) known.set(await md5(path.join(src, f)), { id: d.name, file: f.replaceAll('\\', '/') });
    }
  }
  const out = [];
  for (const img of files) {
    const hit = known.get(await md5(img).catch(() => ''));
    if (hit) out.push({ img, ...hit });
  }
  return out;
}

async function cmdRead(files) {
  if (!files.length) fail('Cách dùng: node scripts/champ-build.mjs read <ảnh> [ảnh…]');
  const cat = await catalogs();
  const sheet = path.join(ROOT, 'review', 'build-read.png');
  const res = await matchAll(files, cat, sheet);
  res.forEach(printResult);
  console.log(`\nẢnh soát: review/build-read.png (mỗi ô: ảnh cắt · icon khớp · độ lệch · khoảng cách với món thứ 2; viền đỏ = cần kiểm)`);
}

async function cmdNew(args) {
  const opt = (k) => args.find((a) => a.startsWith(`--${k}=`))?.split('=')[1];
  const [who, day, ...rest] = args.filter((a) => !a.startsWith('--'));
  // top<N>=<ảnh> (đường dẫn trơn: giữ thứ tự gửi, không có hạng) · tip=<ảnh tooltip>
  const tips = rest.filter((a) => /^tip=/i.test(a)).map((a) => a.slice(4));
  const shots = rest.filter((a) => !/^tip=/i.test(a)).map((a, i) => {
    const m = a.match(/^top(\d+)=(.+)$/i);
    return { rank: m ? Number(m[1]) : null, file: m ? m[2] : a, order: i };
  }).sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99) || a.order - b.order);
  const files = shots.map((x) => x.file);
  const when = parseISO(day ?? '');
  if (!who || !when || !files.length) fail('Cách dùng: node scripts/champ-build.mjs new <tướng> <yyyy-mm-dd> top1=<ảnh> top3=<ảnh> top4=<ảnh> [tip=<ảnh>…] [--role=adc|top|jungle|mid|sp] [--lane=…]');
  if (files.length > 3) fail('Tối đa 3 ảnh build (mẫu ảnh có 3 build)');
  const dupes = await findDuplicates(files);
  if (dupes.length && !args.includes('--allow-duplicate')) {
    fail(`${dupes.length}/${files.length} ảnh build TRÙNG ảnh của build đã làm — người dùng gửi lại ảnh cũ? Hỏi lại.\n  ${dupes.map((d) => `${path.basename(d.img)} = builds/${d.id}/source/${d.file}`).join('\n  ')}\n  (Chắc chắn muốn làm lại thì thêm --allow-duplicate)`);
  }

  const hero = await findHero(who);
  if (!hero?.slug) fail(`Không tìm thấy tướng "${who}" (gõ tên tiếng Trung trong ảnh, tên tiếng Anh hoặc slug)`);
  const slug = hero.slug;

  // đường + vai trò → bộ build của ngày đó (vd build-2026-10-01-adc)
  const tier = await pickTierlist(when.date);
  const inLanes = (tier?.data.lanes ?? []).map((l) => ({ lane: l.lane, c: l.champions.find((c) => c.slug === slug) })).filter((x) => x.c);
  const roleArg = opt('role');
  if (roleArg && !ROLES[roleArg]) fail(`--role=${roleArg} không hợp lệ (${Object.keys(ROLES).join(', ')})`);
  const lane = opt('lane') ?? (roleArg && ROLES[roleArg].lane) ?? inLanes.sort((a, b) => b.c.pick - a.c.pick)[0]?.lane;
  if (!lane) fail(`Không đoán được đường của ${slug} (không có trong tier list) — thêm --role=adc|top|jungle|mid|sp`);
  const role = roleArg ?? roleOfLane(lane);
  const id = `build-${day}-${role}`;
  const dir = path.join(ROOT, 'builds', id);
  const set = (await tryJSON(`builds/${id}/build.json`)) ?? null;
  if (set?.champions.some((c) => c.champion === slug) && !args.includes('--replace')) {
    fail(`${slug} đã có trong builds/${id} — làm lại thì thêm --replace (giữ nguyên vị trí ảnh, ghi đè build)`);
  }

  if (!(await tryJSON(`data/champions/${slug}.json`))) node('scripts/fetch-champion.mjs', slug);
  const champ = await tryJSON(`data/champions/${slug}.json`);

  const cat = await catalogs();
  const res = await matchAll(files, cat, path.join(ROOT, 'review', `build-read-${slug}.png`));
  res.forEach(printResult);

  // trang bị: mã CN → slug, tải món chưa có
  let index = await itemIndex();
  const needed = [...new Set(res.flatMap((r) => r.slots.filter((s) => s.kind === 'item').map((s) => s.id)))];
  for (const cnId of needed.filter((x) => !index.has(x))) {
    const e = cat.equipList.find((x) => x.equipId === cnId);
    const en = await englishName(e.name);
    console.log(`\n↓ tải trang bị mới: ${e.name} (#${cnId})${en ? ` = ${en}` : ' — chỉ Tốc Chiến có, chưa có tên Anh/Việt'}`);
    node('scripts/fetch-item.mjs', en ?? e.name, `--cn=${cnId}`, ...(en ? [] : [`--slug=item-${cnId}`]));
  }
  index = await itemIndex();
  const bySlug = new Map([...index.values()].map((j) => [j.slug, j]));

  const builds = res.map((r, i) => {
    const items = r.slots.filter((s) => s.kind === 'item').map((s) => index.get(s.id).slug);
    return {
      ...(shots[i].rank ? { rank: shots[i].rank } : {}),
      title: '',
      team: '',
      enemy: '',
      spells: r.slots.filter((s) => s.kind === 'spell').map((s) => s.id),
      runes: r.slots.filter((s) => s.kind === 'keystone' || s.kind === 'rune').map((s) => s.id),
      // giày luôn ở ô 6
      items: [...items.filter((s) => !isBoots(bySlug.get(s))), ...items.filter((s) => isBoots(bySlug.get(s)))],
    };
  });
  const boots = builds.map((b) => b.items.find((s) => isBoots(bySlug.get(s)))).filter(Boolean);
  if (new Set(boots).size > 1) {
    const top = [...new Set(boots)].sort((a, b) => boots.filter((x) => x === b).length - boots.filter((x) => x === a).length)[0];
    for (const b of builds) b.items = b.items.map((s) => (isBoots(bySlug.get(s)) ? top : s));
    console.warn(`\n⚠ Giày khác nhau giữa các build (${boots.join(', ')}) → đã đổi hết sang ${top} (đôi xuất hiện nhiều nhất — quy ước người dùng đã chốt). Nói lại trong báo cáo.`);
  }
  const sig = builds.map((b) => b.items.join() + b.runes.join());
  const dup = sig.findIndex((s, i) => sig.indexOf(s) !== i);
  if (dup >= 0) console.warn(`\n⚠ Build ${dup + 1} trùng hệt một build khác — xin người dùng ảnh build khác`);

  const patch = await pickPatch(when.date);
  const src = path.join(dir, 'source', slug);
  await mkdir(src, { recursive: true });
  const ext = (f) => path.extname(f).toLowerCase() || '.jpg';
  for (const [i, x] of shots.entries()) await copyFile(x.file, path.join(src, `${x.rank ? `top${x.rank}` : `build-${i + 1}`}${ext(x.file)}`));
  for (const [i, f] of tips.entries()) await copyFile(f, path.join(src, `trang-bi-${i + 1}${ext(f)}`));

  const name = titleCase(champ.name);
  const entry = {
    champion: slug,
    lane,
    matchups: { note: 'Phân tích theo bộ kỹ năng — chưa có số liệu đối đầu', strong: [], weak: [], synergy: [] },
    builds,
  };
  const out = set ?? {
    id,
    title: `Build ${ROLES[role].name}`,
    role,
    date: when.vn,
    ...(patch ? { patch: patch.id } : {}),
    ...(tier ? { tierlist: tier.id } : {}),
    source: SOURCE,
    champions: [],
    slides: [],
  };
  const at = out.champions.findIndex((c) => c.champion === slug);
  if (at >= 0) out.champions[at] = { ...entry, matchups: out.champions[at].matchups };
  else {
    out.champions.push(entry);
    out.slides.push({ id: slug, type: 'build', champion: slug, title: name });
  }
  await writeFile(path.join(dir, 'build.json'), JSON.stringify(out, null, 2) + '\n');

  console.log(`\n✔ builds/${id}/build.json — ${at >= 0 ? 'ghi đè' : 'thêm'} ${name} (${builds.length} build) · bộ có ${out.champions.length} tướng: ${out.slides.map((s) => s.title).join(', ')}`);
  console.log(`  ảnh gốc  → builds/${id}/source/${slug}/`);
  console.log(`  đường    = ${lane} · vai trò ${ROLES[role].name}${opt('lane') || roleArg ? '' : inLanes.length > 1 ? ` (tướng có ở ${inLanes.map((x) => x.lane).join(', ')} — chọn đường tỉ lệ chọn cao nhất; sai thì chạy lại với --role=…)` : ''}`);
  console.log(`  tierlist = ${out.tierlist ?? '—'}${inLanes.some((x) => x.lane === lane) ? '' : ' (tướng không có ở T0–T1 đường này → không hiện bậc)'}`);
  console.log(`  patch    = ${out.patch ?? '—'}`);
  if (!champ.layout?.face) console.log(`  ⚠ ${slug} chưa đo khuôn mặt → splash-grid.mjs ${slug} rồi --face=x,y (ảnh nền bên trái cắt theo khuôn mặt)`);
  console.log(`\nẢnh soát: review/build-read-${slug}.png · Tiếp theo: viết title/team/enemy + matchups của ${slug} trong builds/${id}/build.json`);
}

const [cmd, ...rest] = process.argv.slice(2);
try {
  if (cmd === 'read') await cmdRead(rest);
  else if (cmd === 'new') await cmdNew(rest);
  else {
    console.log('Cách dùng:\n  node scripts/champ-build.mjs read <ảnh> [ảnh…]\n  node scripts/champ-build.mjs new <tướng> <yyyy-mm-dd> <ảnh build 1> [ảnh 2] [ảnh 3] [--lane=…] [--suffix=b]');
    process.exitCode = 1;
  }
} finally {
  await closeBrowser();
}
