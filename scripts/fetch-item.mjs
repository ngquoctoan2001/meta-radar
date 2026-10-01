// Tải dữ liệu + icon trang bị Tốc Chiến.
//
//   node scripts/fetch-item.mjs "Yun Tal Wildarrows" "Vũ Điệu Tử Thần"
//   node scripts/fetch-item.mjs "Tên lạ" --cn=2238        (chỉ định thẳng mã trang bị CN khi không tự tìm được)
//   node scripts/fetch-item.mjs "Infinity Edge" --tags="Xạ thủ,Chí mạng" --color=#FFC940   (ghi luôn tags + màu nhấn)
//   node scripts/fetch-item.mjs --list                    (in toàn bộ trang bị Tốc Chiến CN: mã, tên, giá, chỉ số)
//   node scripts/fetch-item.mjs --list=3100               (lọc theo giá hoặc chữ trong tên/chỉ số)
//
// Cách tìm: tên tiếng Anh/Việt → mã trang bị Riot (Data Dragon en_US / vi_VN) → tên tiếng Trung (zh_CN)
// → khớp với danh sách trang bị Tốc Chiến máy chủ Trung Quốc (game.gtimg.cn) để lấy icon 128px, giá, chỉ số
// đúng bản Tốc Chiến (bản PC khác số).
//
// Kết quả: data/items/<slug>.json + assets/items/<slug>.png
// Giữ nguyên các trường chỉnh tay (tags, color, nameVi của món chỉ Tốc Chiến có, summary) nếu file đã có.

import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { ROOT } from './lib/patches.mjs';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) meta-wildrift/1.0';
const CN_EQUIP = 'https://game.gtimg.cn/images/lgamem/act/lrlib/js/equip/equip.js';
const DDRAGON = 'https://ddragon.leagueoflegends.com';

// Nhãn chỉ số trên dữ liệu CN → tiếng Việt (cách gọi trong game Tốc Chiến).
const STAT_VI = {
  攻击力: 'Sức mạnh công kích',
  攻击速度: 'Tốc độ đánh',
  暴击率: 'Tỉ lệ chí mạng',
  暴击伤害: 'Sát thương chí mạng',
  最大生命值: 'Máu',
  生命值: 'Máu',
  最大法力值: 'Năng lượng',
  法力值: 'Năng lượng',
  基础法力回复: 'Hồi năng lượng cơ bản',
  基础生命回复: 'Hồi máu cơ bản',
  护甲: 'Giáp',
  魔法抗性: 'Kháng phép',
  魔抗: 'Kháng phép',
  法术强度: 'Sức mạnh phép thuật',
  技能急速: 'Điểm hồi kỹ năng',
  移动速度: 'Tốc độ di chuyển',
  护甲穿透: 'Xuyên giáp',
  护甲穿透率: 'Xuyên giáp',
  法术穿透: 'Xuyên phép',
  法术穿透率: 'Xuyên phép',
  物理吸血: 'Hút máu',
  生命偷取: 'Hút máu',
  全能吸血: 'Hút máu toàn phần',
  治疗和护盾强度: 'Sức mạnh hồi máu & lá chắn',
  韧性: 'Kháng hiệu ứng',
};
const TIER_VI = { 初级: 'Trang bị cơ bản', 中级: 'Trang bị trung cấp', 高级: 'Trang bị cao cấp' };

const norm = (s) =>
  String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase().replace(/[^a-z0-9]/g, '');
const slugify = (s) =>
  String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase()
    .replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

async function get(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res;
}

// Độ giống nhau giữa 2 tên tiếng Trung (tỉ lệ ký tự chung).
function similarity(a, b) {
  const A = new Set(a);
  const B = new Set(b);
  const common = [...A].filter((c) => B.has(c)).length;
  return common / new Set([...A, ...B]).size;
}

async function loadSources() {
  const [version] = await (await get(`${DDRAGON}/api/versions.json`)).json();
  const lang = async (l) => (await (await get(`${DDRAGON}/cdn/${version}/data/${l}/item.json`)).json()).data;
  const [en, vi, zh, cn] = await Promise.all([
    lang('en_US'), lang('vi_VN'), lang('zh_CN'),
    get(CN_EQUIP).then((r) => r.json()).then((d) => d.equipList),
  ]);
  return { en, vi, zh, cn };
}

// Lấy danh sách chỉ số từ mô tả CN, vd "攻击速度 +25% 攻击速度" → { label: 'Tốc độ đánh', value: '+25%' }
// Chỉ đọc khối đầu tiên (trước dòng trống) — phần sau là mô tả nội tại.
function parseStats(description, { quiet = false } = {}) {
  const stats = [];
  for (const line of description.join('').split(/\n\s*\n/)[0].split('\n')) {
    const m = line.match(/([+\-]\d+(?:\.\d+)?%?)\s*(\S+)\s*$/);
    if (!m || line.includes('：')) continue;
    const label = STAT_VI[m[2]];
    if (!label && !quiet) console.warn(`  ⚠ chưa có bản dịch cho chỉ số "${m[2]}" — sửa tay trong JSON`);
    stats.push({ label: label ?? m[2], value: m[1] });
  }
  return stats;
}

// Tên nội tại tiếng Việt lấy từ mô tả vi_VN (bản PC — chỉ dùng tên, không dùng số).
const passiveNames = (html = '') => [...new Set([...html.matchAll(/<(?:passive|active)>([^<]+)<\/(?:passive|active)>/g)].map((m) => m[1].trim()))];

async function fetchItem(query, src, { cnId, slug: slugArg, tags, color } = {}) {
  const q = norm(query);
  const ids = Object.keys(src.en).filter((id) => norm(src.en[id].name) === q || norm(src.vi[id]?.name ?? '') === q);
  const zhNames = [...new Set(ids.map((id) => src.zh[id]?.name).filter(Boolean))];

  let cn;
  if (cnId) cn = src.cn.find((e) => e.equipId === String(cnId));
  else if (zhNames.length) {
    const ranked = src.cn
      .map((e) => ({ e, s: Math.max(...zhNames.map((z) => similarity(z, e.name))) }))
      .sort((a, b) => b.s - a.s);
    if (ranked[0].s >= 0.6) cn = ranked[0].e;
    else console.warn(`  ⚠ "${query}": không khớp chắc chắn. Gần nhất: ${ranked.slice(0, 3).map((r) => `${r.e.name} (mã ${r.e.equipId})`).join(', ')}`);
  }
  if (!cn) throw new Error(ids.length ? 'không tìm thấy trên dữ liệu Tốc Chiến CN — thử --cn=<mã>' : 'không có trang bị nào tên như vậy (thử tên tiếng Anh chính xác)');

  const id = ids[0];
  const nameEn = id ? src.en[id].name : query;
  const slug = slugArg ?? slugify(nameEn);
  const iconFile = `assets/items/${slug}.png`;
  await mkdir(path.join(ROOT, 'assets', 'items'), { recursive: true });
  await writeFile(path.join(ROOT, iconFile), Buffer.from(await (await get(cn.iconPath)).arrayBuffer()));

  const jsonPath = path.join(ROOT, 'data', 'items', `${slug}.json`);
  const old = await readFile(jsonPath, 'utf8').then(JSON.parse, () => ({}));
  const data = {
    slug,
    // trang bị chỉ Tốc Chiến có: không có tên Anh/Việt chính thức → giữ tên ghi tay (nameTemp = tên tạm dịch)
    name: nameEn || old.name || '',
    nameVi: (id ? src.vi[id]?.name : '') || old.nameVi || '',
    ...(old.nameTemp && !(id && src.vi[id]?.name) ? { nameTemp: true } : {}),
    cnId: cn.equipId,
    cnName: cn.name,
    icon: iconFile,
    price: Number(cn.price),
    tier: TIER_VI[cn.level] ?? cn.level,
    // tags + color: chỉnh tay (vd ["Xạ thủ", "Chí mạng"], màu nhấn hợp với icon) — chạy lại script không xoá
    tags: tags ?? old.tags ?? [],
    color: color ?? old.color ?? '#ffcf6b',
    stats: parseStats(cn.description),
    passives: id ? passiveNames(src.vi[id]?.description) : [],
    source: `Dữ liệu Tốc Chiến máy chủ Trung Quốc (game.gtimg.cn, mã ${cn.equipId}) · tên VN theo Riot vi_VN`,
    // giải thích theo tooltip trong game (ghi tay khi làm build) — chạy lại script không xoá
    ...(old.summary ? { summary: old.summary } : {}),
  };
  await mkdir(path.dirname(jsonPath), { recursive: true });
  await writeFile(jsonPath, JSON.stringify(data, null, 2) + '\n');
  return { data, cn };
}

const args = process.argv.slice(2);
const opt = (k) => args.find((a) => a.startsWith(`--${k}=`))?.split('=').slice(1).join('=');
const names = args.filter((a) => !a.startsWith('--'));
const list = args.find((a) => a === '--list' || a.startsWith('--list='));
if (list) {
  // Tra tay cho trang bị chỉ có ở Tốc Chiến (không có trên bản PC nên không tìm theo tên được).
  const filter = list.includes('=') ? list.split('=')[1] : '';
  const cn = (await (await get(CN_EQUIP)).json()).equipList;
  for (const e of cn) {
    const stats = parseStats(e.description, { quiet: true }).map((s) => `${s.value} ${s.label}`).join(', ');
    const row = `#${e.equipId}  ${e.name}  ${e.price} vàng  ${TIER_VI[e.level] ?? e.level}  ${stats}`;
    if (!filter || row.includes(filter)) console.log(row);
  }
  process.exit(0);
}
if (!names.length) {
  console.log('Cách dùng: node scripts/fetch-item.mjs "<tên trang bị>" [...] [--cn=<mã>] [--slug=<slug>] [--tags="A,B"] [--color=#RRGGBB] | --list[=lọc]');
  process.exit(1);
}
const src = await loadSources();
for (const name of names) {
  try {
    const tags = opt('tags')?.split(',').map((t) => t.trim()).filter(Boolean);
    const color = opt('color');
    if (color && !/^#[0-9a-f]{6}$/i.test(color)) throw new Error(`màu "${color}" phải dạng #RRGGBB`);
    const { data, cn } = await fetchItem(name, src, { cnId: opt('cn'), slug: opt('slug'), tags, color });
    console.log(`✔ ${data.name} (${data.nameVi || '—'}) → ${data.slug} · CN ${cn.name} #${cn.equipId} · ${data.price} vàng · ${data.stats.map((s) => `${s.value} ${s.label}`).join(', ')}`);
    console.log(`  tags: ${data.tags.length ? data.tags.join(', ') : '(chưa có — thêm --tags="…")'} · màu: ${data.color}${data.color === '#ffcf6b' ? ' (mặc định — thêm --color=#…)' : ''}`);
  } catch (err) {
    console.error(`✘ ${name}: ${err.message}`);
    process.exitCode = 1;
  }
}
