// Dựng dữ liệu tier list từ ảnh chụp bảng xếp hạng Tốc Chiến Trung Quốc.
//
//   node scripts/tierlist.mjs new 2026-10-07 baron=<ảnh> baron=<ảnh> jungle=<ảnh> …
//                                                              tạo tierlists/tier-2026-10-07/: chép ảnh vào source/ (baron-1.jpg…;
//                                                              ảnh không ghi đường → 01.jpg…), báo ảnh trùng bộ đã làm,
//                                                              tự chọn "patch" (bản cập nhật gần nhất) và "previous"
//                                                              (tier list ngày trước đó, cùng bộ lọc), khung 5 đường + slides.
//        [--suffix=b]                                           thêm bộ thứ hai trong cùng ngày → tier-2026-10-07-b
//        [--filter="Đấu Hạng · Kim Cương trở xuống"]            bộ lọc khác mặc định (Đại Cao Thủ trở lên)
//
//   node scripts/tierlist.mjs lane tier-2026-10-07 baron "辛吉德 T0 57.58 3.77 1.14; 安蓓萨 T1 54.86 3.08 1.62"
//                                                              ghi danh sách tướng 1 đường (đúng thứ tự hạng).
//                                                              Mỗi tướng: <tên Trung | tên Anh | slug> <T0|T1> <thắng> <chọn> <cấm>,
//                                                              ngăn cách bằng ";" hoặc xuống dòng. Câu chốt đã viết được giữ nguyên.
//                                                              Đường: baron | jungle (rung) | mid (giua) | dragon (rong, adc) | support (hotro, sp)
//
//   node scripts/tierlist.mjs compare tier-2026-10-07           so với bản cập nhật + tier list kỳ trước → ý để viết câu chốt,
//                                                              kèm độ dài câu chốt / tiêu đề / ghi chú hiện tại
import { readFile, writeFile, mkdir, readdir, copyFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { ROOT } from './lib/patches.mjs';
import { findHero, localStatus, STATUS_TEXT } from './lib/heroes.mjs';
import { parseVN, pickPatch, listDirs, DAY } from './lib/pick.mjs';

const DEFAULT_FILTER = 'Đấu Hạng · Đại Cao Thủ trở lên';
const SOURCE = 'Bảng xếp hạng Tốc Chiến Trung Quốc';
const LANES = ['baron', 'jungle', 'mid', 'dragon', 'support'];
const LANE_NAME = { baron: 'Đường Baron', jungle: 'Đi Rừng', mid: 'Đường Giữa', dragon: 'Đường Rồng', support: 'Hỗ Trợ' };
const LANE_ALIAS = { top: 'baron', rung: 'jungle', jg: 'jungle', giua: 'mid', rong: 'dragon', adc: 'dragon', ad: 'dragon', hotro: 'support', sp: 'support', sup: 'support' };
const STATUS_LABEL = { buff: 'BUFF', nerf: 'NERF', adjust: 'ĐIỀU CHỈNH', mixed: 'ĐIỀU CHỈNH', rework: 'LÀM LẠI', new: 'MỚI' };

const readJSON = (p) => readFile(path.join(ROOT, p), 'utf8').then(JSON.parse);
const tryJSON = (p) => readJSON(p).catch(() => null);
const writeJSON = (p, data) => writeFile(path.join(ROOT, p), JSON.stringify(data, null, 2) + '\n');
const exists = (p) => stat(path.join(ROOT, p)).then(() => true, () => false);
const fail = (msg) => { console.error(`✘ ${msg}`); process.exit(1); };

// Tier list kỳ trước: cùng bộ lọc, ngày sớm hơn. Bộ khác cùng ngày không tính (không phải "kỳ trước").
async function pickPrevious(id, date, filter) {
  const all = [];
  for (const dir of await listDirs('tierlists')) {
    const t = await tryJSON(`tierlists/${dir}/tierlist.json`);
    if (t && t.id !== id && t.filter === filter && parseVN(t.date)) all.push({ id: t.id, date: parseVN(t.date) });
  }
  return all
    .filter((t) => t.date < date)
    .sort((a, b) => b.date - a.date || b.id.localeCompare(a.id))[0] ?? null;
}

const md5 = async (file) => createHash('md5').update(await readFile(file)).digest('hex');

// Ảnh người dùng gửi có trùng ảnh gốc của tier list đã làm không → [{ img, id, file }]
async function findDuplicates(images) {
  const known = new Map();
  for (const dir of await listDirs('tierlists')) {
    for (const f of await readdir(path.join(ROOT, 'tierlists', dir, 'source')).catch(() => [])) {
      known.set(await md5(path.join(ROOT, 'tierlists', dir, 'source', f)), { id: dir, file: f });
    }
  }
  const dups = [];
  for (const img of images) {
    const hit = known.get(await md5(img).catch(() => ''));
    if (hit) dups.push({ img, ...hit });
  }
  return dups;
}

async function cmdNew(args) {
  const day = args.find((a) => /^\d{4}-\d{2}-\d{2}$/.test(a));
  if (!day) fail('Thiếu ngày dạng yyyy-mm-dd (lấy ở dòng 刷新时间 trong ảnh), vd: node scripts/tierlist.mjs new 2026-10-07 a.jpg b.jpg');
  const suffix = args.find((a) => a.startsWith('--suffix='))?.split('=')[1];
  const filter = args.find((a) => a.startsWith('--filter='))?.slice(9) ?? DEFAULT_FILTER;
  // "baron=C:\…\a.jpg" → { lane: 'baron', file } ; đường dẫn trơn → { lane: null, file }
  const images = args.filter((a) => a !== day && !a.startsWith('--')).map((a) => {
    const m = a.match(/^([a-z-]+)=(.+)$/i);
    const lane = m ? LANE_ALIAS[m[1].toLowerCase()] ?? m[1].toLowerCase() : null;
    if (lane && !LANES.includes(lane)) fail(`Đường "${m[1]}" không hợp lệ (baron, jungle, mid, dragon, support)`);
    return { lane, file: m ? m[2] : a };
  });
  const [y, m, d] = day.split('-');
  const date = parseVN(`${d}/${m}/${y}`);
  if (!date || date.getUTCMonth() !== +m - 1) fail(`Ngày không hợp lệ: ${day}`);

  const id = `tier-${day}${suffix ? `-${suffix}` : ''}`;
  const dir = `tierlists/${id}`;
  if (await exists(`${dir}/tierlist.json`)) fail(`${dir}/tierlist.json đã có — sửa bộ đó, hoặc tạo bộ thứ hai bằng --suffix=b`);

  const dups = await findDuplicates(images.map((i) => i.file));
  if (dups.length) {
    const all = dups.length === images.length;
    const list = dups.map((d) => `${path.basename(d.img)} = tierlists/${d.id}/source/${d.file}`).join('\n  ');
    if (all && !args.includes('--allow-duplicate')) {
      fail(`Cả ${images.length} ảnh đều TRÙNG ảnh của tier list đã làm — người dùng gửi nhầm ảnh cũ? Hỏi lại, đừng làm bộ mới.\n  ${list}\n  (Chắc chắn muốn làm lại thì thêm --allow-duplicate)`);
    }
    console.warn(`⚠ ${dups.length}/${images.length} ảnh trùng ảnh đã dùng:\n  ${list}`);
  }

  await mkdir(path.join(ROOT, dir, 'source'), { recursive: true });
  const copied = [];
  const perLane = {};
  for (const [i, { lane, file }] of images.entries()) {
    const ext = path.extname(file).toLowerCase() || '.jpg';
    const name = lane ? `${lane}-${(perLane[lane] = (perLane[lane] ?? 0) + 1)}${ext}` : `${String(i + 1).padStart(2, '0')}${ext}`;
    await copyFile(file, path.join(ROOT, dir, 'source', name)).catch((e) => fail(`Không chép được ảnh ${file}: ${e.message}`));
    copied.push(name);
  }

  const patch = await pickPatch(date);
  const previous = await pickPrevious(id, date, filter);
  const dateVN = `${d}/${m}/${y}`;
  const t = {
    id,
    // bộ lọc khác mặc định → ghi vào tiêu đề để phân biệt trên trang quản lý
    title: `Tier List ${d}/${m}${filter !== DEFAULT_FILTER ? ` · ${filter.split('·').pop().trim()}` : suffix ? ` (${suffix})` : ''}`,
    date: dateVN,
    ...(patch ? { patch: patch.id } : {}),
    ...(previous ? { previous: previous.id } : {}),
    source: SOURCE,
    filter,
    headline: '',
    lanes: LANES.map((lane) => ({ lane, verdict: '', champions: [] })),
    slides: [
      { id: 'overview', type: 'tier-overview', title: 'Tổng quan' },
      ...LANES.map((lane) => ({ id: lane, type: 'tier-lane', lane })),
    ],
  };
  await writeJSON(`${dir}/tierlist.json`, t);

  console.log(`✔ ${dir}/tierlist.json`);
  if (copied.length) console.log(`  ảnh gốc → ${dir}/source/ (${copied.join(', ')})`);
  console.log(`  patch    = ${patch ? `${patch.id} (${patch.why})` : '— (chưa có bản cập nhật nào)'}`);
  console.log(`  previous = ${previous ? previous.id : '— (chưa có tier list ngày trước đó cùng bộ lọc → không được viết "lên/xuống hạng")'}`);
  if (filter !== DEFAULT_FILTER) console.log(`  bộ lọc   = ${filter} (khác mặc định "${DEFAULT_FILTER}")`);
  if (patch?.date) {
    const days = Math.round((date - patch.date) / DAY);
    console.log(`  ${patch.id} ra ${days} ngày trước ngày này${days <= 3 ? ` → nên ghi "note", vd: "${patch.id} mới cập nhật ${days} ngày — bảng xếp hạng chưa kịp đổi nhiều"` : ''}`);
  }
  console.log('\nTiếp theo: ghi từng đường bằng  node scripts/tierlist.mjs lane ' + id + ' <đường> "<tên> <T0|T1> <thắng> <chọn> <cấm>; …"');
}

function parseEntries(text) {
  return text.split(/[;\n]+/).map((s) => s.trim()).filter(Boolean).map((s) => {
    const parts = s.split(/\s+/);
    if (parts.length < 5) return { raw: s, error: 'cần: <tên> <T0|T1> <thắng> <chọn> <cấm>' };
    const [tier, win, pick, ban] = parts.slice(-4);
    return { raw: s, name: parts.slice(0, -4).join(' '), tier: tier.toUpperCase(), win: Number(win.replace('%', '').replace(',', '.')), pick: Number(pick.replace('%', '').replace(',', '.')), ban: Number(ban.replace('%', '').replace(',', '.')) };
  });
}

async function cmdLane([id, laneArg, ...rest]) {
  const lane = LANE_ALIAS[laneArg] ?? laneArg;
  if (!id || !LANES.includes(lane) || !rest.length) fail('Cách dùng: node scripts/tierlist.mjs lane <id> <baron|jungle|mid|dragon|support> "<tên> <T0|T1> <thắng> <chọn> <cấm>; …"');
  const file = `tierlists/${id}/tierlist.json`;
  const t = await tryJSON(file);
  if (!t) fail(`Không có ${file} — tạo bằng: node scripts/tierlist.mjs new <yyyy-mm-dd>`);

  const errors = [];
  const champions = [];
  let lastTier = 'T0';
  for (const e of parseEntries(rest.join('\n'))) {
    if (e.error) { errors.push(`"${e.raw}": ${e.error}`); continue; }
    if (!['T0', 'T1'].includes(e.tier)) errors.push(`"${e.raw}": bậc phải là T0 hoặc T1 (T2 trở xuống không lấy)`);
    if (e.tier < lastTier) errors.push(`"${e.raw}": T0 phải đứng trước T1 — ghi đúng thứ tự hạng trong ảnh`);
    lastTier = e.tier;
    for (const k of ['win', 'pick', 'ban']) if (!(e[k] >= 0 && e[k] <= 100)) errors.push(`"${e.raw}": ${k} = ${e[k]} không phải số 0–100`);
    const hero = await findHero(e.name);
    if (!hero) { errors.push(`"${e.name}": không tìm thấy tướng (thử tên tiếng Anh hoặc slug)`); continue; }
    if (!hero.slug) { errors.push(`"${e.name}" = ${hero.en}: chưa có trên trang vi-vn — báo người dùng`); continue; }
    if (champions.some((c) => c.slug === hero.slug)) { errors.push(`"${e.name}": bị lặp (2 ảnh của cùng đường thường trùng 1 dòng)`); continue; }
    champions.push({ slug: hero.slug, tier: e.tier, win: e.win, pick: e.pick, ban: e.ban, _cn: hero.cn });
  }
  if (errors.length) fail(`Chưa ghi gì — sửa lại:\n  ${errors.join('\n  ')}`);

  const entry = t.lanes.find((l) => l.lane === lane);
  entry.champions = champions.map(({ _cn, ...c }) => c);
  await writeJSON(file, t);
  console.log(`✔ ${LANE_NAME[lane]}: ${champions.length} tướng (${champions.filter((c) => c.tier === 'T0').length} T0)`);
  for (const [i, c] of champions.entries()) {
    console.log(`  #${i + 1} ${c.tier} ${c._cn} = ${c.slug.padEnd(14)} ${c.win}% · chọn ${c.pick}% · cấm ${c.ban}%  [${STATUS_TEXT[await localStatus(c.slug)]}]`);
  }
}

async function cmdCompare([id]) {
  const t = await tryJSON(`tierlists/${id}/tierlist.json`);
  if (!t) fail(`Không có tierlists/${id}/tierlist.json`);
  const patch = t.patch ? await tryJSON(`patches/${t.patch}/patch.json`) : null;
  const prev = t.previous ? await tryJSON(`tierlists/${t.previous}/tierlist.json`) : null;
  const pStatus = (slug) => patch?.champions?.find((c) => c.slug === slug)?.status;

  console.log(`${t.title} · ${t.filter}`);
  console.log(`So với bản cập nhật: ${patch ? patch.id : '—'} · tier list kỳ trước: ${prev ? `${prev.id} (${prev.date})` : '— (KHÔNG được viết lên/xuống hạng)'}`);
  if (patch?.date && parseVN(t.date)) console.log(`${patch.id} ra ngày ${patch.date} → ${Math.round((parseVN(t.date) - parseVN(patch.date)) / DAY)} ngày trước tier list`);

  const seen = new Set();
  for (const l of t.lanes) {
    const before = prev?.lanes.find((x) => x.lane === l.lane)?.champions ?? [];
    console.log(`\n${LANE_NAME[l.lane]} — ${l.champions.filter((c) => c.tier === 'T0').length || 'KHÔNG CÓ'} T0, ${l.champions.filter((c) => c.tier === 'T1').length} T1`);
    for (const [i, c] of l.champions.entries()) {
      seen.add(c.slug);
      const tags = [];
      const st = pStatus(c.slug);
      if (st) tags.push(`${STATUS_LABEL[st] ?? st} ${patch.id}`);
      if (prev) {
        const b = before.find((x) => x.slug === c.slug);
        if (!b) tags.push('MỚI vào T0–T1');
        else {
          if (b.tier !== c.tier) tags.push(b.tier > c.tier ? `LÊN ${c.tier}` : `XUỐNG ${c.tier}`);
          const dw = +(c.win - b.win).toFixed(2);
          if (dw) tags.push(`thắng ${dw > 0 ? '+' : ''}${dw}`);
        }
      }
      if (c.ban >= 50) tags.push(`cấm rất cao ${c.ban}%`);
      console.log(`  #${i + 1} ${c.tier} ${c.slug.padEnd(14)} thắng ${c.win}% · chọn ${c.pick}% · cấm ${c.ban}%${tags.length ? `  ← ${tags.join(' · ')}` : ''}`);
    }
    if (prev) {
      const left = before.filter((b) => !l.champions.some((c) => c.slug === b.slug));
      if (left.length) console.log(`  rời khỏi T0–T1: ${left.map((b) => `${b.slug} (từng ${b.tier}${pStatus(b.slug) ? `, ${STATUS_LABEL[pStatus(b.slug)]} ${patch.id}` : ''})`).join(', ')}`);
    }
  }
  if (patch) {
    const absent = (patch.champions ?? []).filter((c) => !seen.has(c.slug));
    if (absent.length) console.log(`\nCó trong ${patch.id} nhưng không có ở T0–T1 đường nào: ${absent.map((c) => `${c.slug} (${STATUS_LABEL[c.status] ?? c.status})`).join(', ')}`);
    if (patch.items?.length) console.log(`Trang bị đổi ở ${patch.id}: ${patch.items.map((i) => `${i.slug} (${STATUS_LABEL[i.status] ?? i.status})`).join(', ')}`);
    if (patch.systems?.length) console.log(`Hệ thống đổi ở ${patch.id}: ${patch.systems.map((s) => `${s.name} — ${s.summary ?? ''}`).join(' · ')}`);
  }

  // Độ dài chữ hiện tại — chỉ là gợi ý (references/viet-cau-chot-tier.md); audit mới quyết định có vừa khung hay không
  const len = (label, text, max) => console.log(`  ${label.padEnd(10)} ${text ? `${String(text.length).padStart(3)} ký tự${text.length > max ? `  ⚠ dài hơn ~${max}` : ''}` : '— chưa viết'}`);
  console.log('\nĐộ dài chữ:');
  len('headline', t.headline, 55);
  len('note', t.note, 60);
  for (const l of t.lanes) {
    const t0 = l.champions.filter((c) => c.tier === 'T0').length;
    len(l.lane, l.verdict, t0 >= 3 ? 115 : t0 === 2 ? 90 : 100);
  }
}

const [cmd, ...rest] = process.argv.slice(2);
const COMMANDS = { new: cmdNew, lane: cmdLane, compare: cmdCompare };
if (!COMMANDS[cmd]) {
  console.log('Cách dùng:\n  node scripts/tierlist.mjs new <yyyy-mm-dd> [ảnh…] [--suffix=b] [--filter="…"]\n  node scripts/tierlist.mjs lane <id> <đường> "<tên> <T0|T1> <thắng> <chọn> <cấm>; …"\n  node scripts/tierlist.mjs compare <id>');
  process.exit(1);
}
await COMMANDS[cmd](rest);
