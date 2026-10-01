// Kiểm tra bộ ảnh (bản cập nhật hoặc tier list) trước khi đăng.
//
//   node scripts/audit.mjs 7.3a                 → báo cáo lỗi từng ảnh (thoát mã 1 nếu có lỗi)
//   node scripts/audit.mjs 7.3a --sheet         → thêm ảnh tổng hợp cả bộ: review/<id>-tong-hop.png
//   node scripts/audit.mjs tier-2026-09-30      → tier list
//
// 1. Dữ liệu: patch.json (tướng/trang bị có dữ liệu chưa, key kỹ năng, dòng số liệu so sánh được không,
//    trạng thái, câu chốt, danh sách slides) hoặc tierlist.json (đường, bậc, số liệu, khuôn mặt tướng).
// 2. Ảnh: khối nội dung đè chân ảnh / thanh trên, thẻ bị cắt, chữ tràn, ảnh không tải được,
//    cảnh báo tự co chữ (câu chốt quá dài, quá nhiều thay đổi…), lỗi vẽ ảnh.
import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { ROOT } from './lib/patches.mjs';
import { ensureServer } from './lib/ensure-server.mjs';
import { getBrowser, closeBrowser } from './lib/renderer.mjs';
import { CANVAS } from '../src/js/lib/output.js';
import { analyzeLine } from '../src/js/lib/values.js';
import { collectionKind, collectionFile } from '../src/js/lib/collections.js';

const args = process.argv.slice(2);
const patchId = args.find((a) => !a.startsWith('--'));
if (!patchId) {
  console.log('Cách dùng: node scripts/audit.mjs <patch> [--sheet]');
  process.exit(1);
}

const STATUSES = ['buff', 'nerf', 'adjust', 'mixed', 'rework', 'new'];
const exists = (p) => readFile(path.join(ROOT, p)).then(() => true, () => false);
const loadJSON = (p) => readFile(path.join(ROOT, p), 'utf8').then(JSON.parse, () => null);

// Kiểm tra patch.json trước khi vẽ: lỗi (✘) làm ảnh sai, lưu ý (⚠) nên xem lại.
async function validateData(patch, folder) {
  const errors = [];
  const notes = [];
  const VERDICT_MAX = 100; // ~3 dòng câu chốt

  if (patch.id !== folder) errors.push(`"id" là "${patch.id}" nhưng thư mục là "${folder}"`);

  const checkLines = (where, lines) => {
    if (!lines?.length) errors.push(`${where}: không có dòng thay đổi nào`);
    for (const l of lines ?? []) {
      if (!l.label) errors.push(`${where}: có dòng thiếu "label"`);
      if (l.text) continue;
      if (l.old === undefined || l.new === undefined) { errors.push(`${where} · ${l.label}: thiếu "old"/"new" (hoặc dùng "text")`); continue; }
      const r = analyzeLine(l);
      if (!l.effect && (r.oldV.kind === 'text' || r.newV.kind === 'text' || !r.ds)) {
        notes.push(`${where} · ${l.label}: "${l.old} → ${l.new}" không so sánh tự động được — nên tách dòng hoặc ghi "effect"`);
      }
    }
  };
  const checkEntry = (where, e) => {
    if (!STATUSES.includes(e.status)) errors.push(`${where}: "status" = "${e.status}" không hợp lệ (${STATUSES.join(', ')})`);
    if (!e.verdict) notes.push(`${where}: chưa có câu chốt`);
    else if (e.verdict.length > VERDICT_MAX) notes.push(`${where}: câu chốt dài ${e.verdict.length} ký tự (nên ≤ ${VERDICT_MAX})`);
  };

  for (const c of patch.champions ?? []) {
    const champ = await loadJSON(`data/champions/${c.slug}.json`);
    const where = `tướng ${c.slug}`;
    if (!champ) { errors.push(`${where}: chưa có data/champions/${c.slug}.json → chạy fetch-champion.mjs`); continue; }
    checkEntry(where, c);
    for (const g of c.changes ?? []) {
      if (g.key === 'stats') { checkLines(`${where} · chỉ số`, g.lines); continue; }
      if (!['p', 'q', 'w', 'e', 'r'].includes(g.key)) errors.push(`${where}: key kỹ năng "${g.key}" không hợp lệ (stats, p, q, w, e, r)`);
      else if (!champ.skills?.some((s) => s.key === g.key && s.icon)) errors.push(`${where}: không có icon cho kỹ năng "${g.key}"`);
      checkLines(`${where} · ${g.badge ?? g.key.toUpperCase()}`, g.lines);
    }
    if (!(await exists(champ.splash))) errors.push(`${where}: thiếu ảnh splash ${champ.splash}`);
  }
  for (const it of patch.items ?? []) {
    const item = await loadJSON(`data/items/${it.slug}.json`);
    const where = `trang bị ${it.slug}`;
    if (!item) { errors.push(`${where}: chưa có data/items/${it.slug}.json → chạy fetch-item.mjs`); continue; }
    checkEntry(where, it);
    if (!(await exists(item.icon))) errors.push(`${where}: thiếu icon ${item.icon}`);
    if (!item.tags?.length) notes.push(`${where}: chưa có "tags" trong data/items/${it.slug}.json`);
    for (const g of it.changes ?? []) {
      if (!['stats', 'passive'].includes(g.key)) errors.push(`${where}: key "${g.key}" không hợp lệ (stats, passive)`);
      checkLines(`${where} · ${g.name ?? g.key}`, g.lines);
    }
  }
  for (const sys of patch.systems ?? []) {
    if (sys.icon && !(await exists(sys.icon))) errors.push(`hệ thống ${sys.slug}: thiếu icon ${sys.icon}`);
    if (!sys.icon && !['nexus', 'tower', 'shield'].includes(sys.iconSvg)) notes.push(`hệ thống ${sys.slug}: không có icon (dùng "icon" hoặc "iconSvg": nexus | tower | shield)`);
    checkLines(`hệ thống ${sys.slug}`, sys.lines);
  }

  const ids = new Set();
  for (const s of patch.slides ?? []) {
    if (ids.has(s.id)) errors.push(`slides: trùng id "${s.id}"`);
    ids.add(s.id);
    if (!['overview', 'champion', 'item', 'system'].includes(s.type)) errors.push(`slides: loại "${s.type}" không hợp lệ`);
    if (s.type === 'champion' && !patch.champions?.some((c) => c.slug === s.ref)) errors.push(`slides: tướng "${s.ref}" không có trong champions`);
    if (s.type === 'item' && !patch.items?.some((i) => i.slug === s.ref)) errors.push(`slides: trang bị "${s.ref}" không có trong items`);
  }
  for (const c of patch.champions ?? []) if (!patch.slides?.some((s) => s.ref === c.slug)) notes.push(`tướng ${c.slug} chưa có ảnh riêng trong "slides"`);
  for (const i of patch.items ?? []) if (!patch.slides?.some((s) => s.ref === i.slug)) notes.push(`trang bị ${i.slug} chưa có ảnh riêng trong "slides"`);
  return { errors, notes };
}

// Kiểm tra tierlist.json.
const LANE_KEYS = ['baron', 'jungle', 'mid', 'dragon', 'support'];
async function validateTierlist(t, folder) {
  const errors = [];
  const notes = [];
  const VERDICT_MAX = 110;
  if (t.id !== folder) errors.push(`"id" là "${t.id}" nhưng thư mục là "${folder}"`);
  for (const k of ['date', 'source', 'filter']) if (!t[k]) errors.push(`thiếu "${k}" (in ở chân ảnh)`);
  if (t.patch && !(await exists(`patches/${t.patch}/patch.json`))) errors.push(`"patch": không có patches/${t.patch}/patch.json`);
  if (t.previous && !(await exists(`tierlists/${t.previous}/tierlist.json`))) errors.push(`"previous": không có tierlists/${t.previous}/tierlist.json`);
  for (const l of t.lanes ?? []) {
    const where = `đường ${l.lane}`;
    if (!LANE_KEYS.includes(l.lane)) errors.push(`${where}: không hợp lệ (${LANE_KEYS.join(', ')})`);
    if (!l.verdict) notes.push(`${where}: chưa có câu chốt`);
    else if (l.verdict.length > VERDICT_MAX) notes.push(`${where}: câu chốt dài ${l.verdict.length} ký tự (nên ≤ ${VERDICT_MAX})`);
    const t0 = l.champions.filter((c) => c.tier === 'T0').length;
    if (t0 > 3) errors.push(`${where}: ${t0} tướng T0 — mẫu ảnh chứa tối đa 3, báo người dùng`);
    if (l.champions.length - t0 > 7) errors.push(`${where}: ${l.champions.length - t0} tướng T1 — mẫu ảnh chứa tối đa 7, báo người dùng`);
    else if (l.champions.length - t0 > 6) notes.push(`${where}: ${l.champions.length - t0} tướng T1 — thẻ hẹp, soát kỹ tên tướng trong ảnh`);
    if (!l.champions.length) errors.push(`${where}: chưa có tướng nào → tierlist.mjs lane`);
    let lastTier = 'T0';
    for (const c of l.champions) {
      const w = `${where} · ${c.slug}`;
      if (!['T0', 'T1'].includes(c.tier)) errors.push(`${w}: "tier" = "${c.tier}" (chỉ T0, T1)`);
      if (c.tier < lastTier) errors.push(`${w}: T0 phải đứng trước T1 (giữ đúng thứ hạng)`);
      lastTier = c.tier;
      for (const k of ['win', 'pick', 'ban']) if (!(typeof c[k] === 'number' && c[k] >= 0 && c[k] <= 100)) errors.push(`${w}: "${k}" phải là số 0–100 (vd 53.15)`);
      const champ = await loadJSON(`data/champions/${c.slug}.json`);
      if (!champ) { errors.push(`${w}: chưa có data/champions/${c.slug}.json → chạy fetch-champion.mjs`); continue; }
      if (!champ.layout?.face) notes.push(`${w}: chưa đo khuôn mặt (layout.face) → splash-grid.mjs ${c.slug} --face=x,y`);
      if (!(await exists(champ.splash))) errors.push(`${w}: thiếu ảnh splash ${champ.splash}`);
    }
  }
  const ids = new Set();
  for (const s of t.slides ?? []) {
    if (ids.has(s.id)) errors.push(`slides: trùng id "${s.id}"`);
    ids.add(s.id);
    if (!['tier-overview', 'tier-lane'].includes(s.type)) errors.push(`slides: loại "${s.type}" không hợp lệ (tier-overview, tier-lane)`);
    if (s.type === 'tier-lane' && !t.lanes?.some((l) => l.lane === s.lane)) errors.push(`slides: đường "${s.lane}" không có trong lanes`);
  }
  return { errors, notes };
}

// Kiểm tra build.json (bộ build: 1 ngày + 1 vai trò, nhiều tướng).
const ROLE_KEYS = ['adc', 'top', 'jungle', 'mid', 'sp'];
const isBootsItem = (it) => !!it && (it.tags?.includes('Giày') || /greaves|boots|treads|steelcaps|shoes/i.test(it.name ?? '') || /靴|胫甲|鞋/.test(it.cnName ?? ''));
async function validateBuild(b, folder) {
  const errors = [];
  const notes = [];
  if (b.id !== folder) errors.push(`"id" là "${b.id}" nhưng thư mục là "${folder}"`);
  if (!ROLE_KEYS.includes(b.role)) errors.push(`"role" = "${b.role}" không hợp lệ (${ROLE_KEYS.join(', ')})`);
  if (b.tierlist && !(await exists(`tierlists/${b.tierlist}/tierlist.json`))) errors.push(`"tierlist": không có tierlists/${b.tierlist}`);
  if (b.patch && !(await exists(`patches/${b.patch}/patch.json`))) notes.push(`"patch": không có patches/${b.patch} (chỉ dùng làm nhãn phiên bản)`);
  const runes = await loadJSON('data/runes.json');
  if (!runes) errors.push('chưa có data/runes.json → node scripts/fetch-runes.mjs');
  if (!b.champions?.length) errors.push('chưa có tướng nào trong "champions"');

  const noSummary = new Set();
  const synergyTrios = new Map();
  for (const e of b.champions ?? []) {
    const who = e.champion;
    const champ = await loadJSON(`data/champions/${who}.json`);
    if (!champ) errors.push(`${who}: chưa có data/champions/${who}.json → fetch-champion.mjs`);
    else if (!champ.layout?.face) notes.push(`${who}: chưa đo khuôn mặt → splash-grid.mjs ${who} --face=x,y`);
    if (!b.slides?.some((s) => s.champion === who)) errors.push(`${who}: chưa có ảnh trong "slides"`);
    if (!e.builds?.length || e.builds.length > 3) errors.push(`${who}: cần 1–3 build (đang có ${e.builds?.length ?? 0})`);
    const bootsUsed = new Set();
    for (const [i, x] of (e.builds ?? []).entries()) {
      const w = `${who} · build ${i + 1}`;
      for (const k of ['title', 'team', 'enemy']) if (!x[k]) errors.push(`${w}: thiếu "${k}"`);
      if (x.items?.length !== 6) errors.push(`${w}: cần đúng 6 trang bị (đang có ${x.items?.length ?? 0})`);
      const boots = [];
      for (const s of x.items ?? []) {
        const it = await loadJSON(`data/items/${s}.json`);
        if (!it) { errors.push(`${w}: chưa có data/items/${s}.json → fetch-item.mjs`); continue; }
        if (isBootsItem(it)) boots.push(s);
        if (!it.summary) noSummary.add(s);
      }
      boots.forEach((s) => bootsUsed.add(s));
      if (boots.length > 1) notes.push(`${w}: có ${boots.length} đôi giày (${boots.join(', ')})`);
      if (boots.length === 1 && x.items.at(-1) !== boots[0]) notes.push(`${w}: giày (${boots[0]}) không ở vị trí 6 — ảnh tự xếp giày xuống cuối, nên sửa thứ tự trong build.json cho khớp`);
      if (x.runes?.length !== 5) errors.push(`${w}: cần đúng 5 ngọc (1 ngọc chính + 4) — đang có ${x.runes?.length ?? 0}`);
      for (const r of x.runes ?? []) if (runes && !runes.runes.some((y) => y.id === r)) errors.push(`${w}: không có ngọc mã "${r}" trong data/runes.json`);
      if (runes && x.runes?.[0] && runes.runes.find((y) => y.id === x.runes[0])?.type !== 'keystone') errors.push(`${w}: ngọc đầu tiên phải là ngọc chính`);
      if (x.spells?.length !== 2) errors.push(`${w}: cần đúng 2 phép bổ trợ`);
      for (const k of x.spells ?? []) if (runes && !runes.spells.some((y) => y.key === k)) errors.push(`${w}: không có phép bổ trợ "${k}"`);
    }
    if (bootsUsed.size > 1) notes.push(`${who}: các build đi giày khác nhau (${[...bootsUsed].join(', ')}) — quy ước: cùng một đôi`);
    const m = e.matchups ?? {};
    for (const [k, label] of [['strong', 'mạnh khi gặp'], ['weak', 'yếu khi gặp'], ['synergy', 'hợp với']]) {
      if (m[k]?.length !== 3) { errors.push(`${who} · matchups.${k} (${label}): cần đúng 3 tướng (đang có ${m[k]?.length ?? 0})`); if (!m[k]?.length) continue; }
      for (const slug of m[k]) {
        const c = await loadJSON(`data/champions/${slug}.json`);
        if (!c) errors.push(`${who} · matchups.${k}: chưa có data/champions/${slug}.json → fetch-champion.mjs`);
        else if (!(await exists(c.portrait))) errors.push(`${who} · matchups.${k}: thiếu ảnh ${c.portrait}`);
      }
    }
    if (m.synergy?.length) {
      const key = [...m.synergy].sort().join(',');
      if (synergyTrios.has(key)) notes.push(`${who}: "hợp với" trùng hệt ${synergyTrios.get(key)} (${key}) — nên chọn theo lối chơi từng tướng`);
      else synergyTrios.set(key, who);
    }
  }
  if (noSummary.size) notes.push(`chưa có giải thích ("summary") cho: ${[...noSummary].join(', ')} — không bắt buộc, để dành`);
  for (const s of b.slides ?? []) {
    if (!['build', 'build-items'].includes(s.type)) errors.push(`slides: loại "${s.type}" không hợp lệ (build, build-items)`);
    if (!b.champions?.some((c) => c.champion === s.champion)) errors.push(`slides: "${s.id}" trỏ tới tướng "${s.champion}" không có trong champions`);
  }
  return { errors, notes };
}

// Chạy trong trang slide: trả về danh sách lỗi bố cục.
function checkLayout() {
  const issues = [];
  const r = (el) => el.getBoundingClientRect();
  const name = (el) => `.${el.classList[0]}${el.querySelector('.chg-title, h1, h3') ? ` "${el.querySelector('.chg-title, h1, h3').textContent.trim()}"` : ''}`;
  const foot = document.querySelector('.footbar');
  const top = document.querySelector('.topbar');
  for (const el of document.querySelectorAll('.verdict, .chg, .balance, .after, .ov-group, .ov-row, .sys-card, .status, .tl-row, .tov-col, .tt, .bd-card, .bd-hero, .bi-grid')) {
    const b = r(el);
    if (!b.height) continue;
    if (foot && b.bottom > r(foot).top - 4) issues.push(`${name(el)} đè chân ảnh (đáy ${Math.round(b.bottom)} > ${Math.round(r(foot).top)})`);
    if (top && b.top < r(top).bottom + 4) issues.push(`${name(el)} đè thanh trên (đỉnh ${Math.round(b.top)})`);
  }
  for (const box of document.querySelectorAll('.changes')) {
    for (const card of box.children) if (r(card).bottom > r(box).bottom + 1) issues.push(`${name(card)} bị cắt mất phần dưới`);
  }
  for (const gear of document.querySelectorAll('.bd-gear')) {
    if (gear.scrollWidth > gear.clientWidth + 1) issues.push(`hàng trang bị + ngọc của ${name(gear.closest('.bd-card'))} tràn ngang (bị cắt)`);
  }
  for (const card of document.querySelectorAll('.bd-card, .bi-card')) {
    if (card.scrollHeight > card.clientHeight + 1) issues.push(`${name(card)} chật — nội dung tràn khỏi thẻ`);
  }
  const hero = document.querySelector('.bd-hero');
  if (hero && hero.scrollHeight > hero.clientHeight + 1) issues.push('cột trái (tên, ngọc, câu chốt) tràn lên thanh trên — rút câu chốt');
  for (const side of document.querySelectorAll('.tl-side')) {
    if (side.scrollHeight > side.clientHeight + 1) issues.push('câu chốt của đường quá dài, đè khung số liệu — rút còn 2 dòng (≤ ~90 ký tự)');
  }
  for (const el of document.querySelectorAll('[data-fit]')) {
    if (el.scrollWidth > el.clientWidth + 1) issues.push(`chữ tràn: "${el.textContent.trim()}"`);
  }
  for (const img of document.images) {
    if (!img.naturalWidth) issues.push(`ảnh không tải được: ${img.getAttribute('src')}`);
  }
  return issues;
}

const { origin: ORIGIN, stop } = await ensureServer();
let failed = 0;
try {
  const patch = JSON.parse(await readFile(path.join(ROOT, collectionFile(patchId)), 'utf8'));

  console.log(`— Dữ liệu ${collectionFile(patchId).split('/').pop()} —`);
  const validate = { patch: validateData, tierlist: validateTierlist, build: validateBuild }[collectionKind(patchId)];
  const { errors, notes } = await validate(patch, patchId);
  for (const e of errors) console.log(`✘ ${e}`);
  for (const n of notes) console.log(`⚠ ${n}`);
  if (!errors.length && !notes.length) console.log('✔ hợp lệ');
  failed += errors.length;
  console.log('\n— Ảnh —');

  const browser = await getBrowser();

  for (const s of patch.slides) {
    const page = await browser.newPage({ viewport: CANVAS });
    const logs = [];
    page.on('console', (m) => (m.type() === 'warning' || m.type() === 'error') && logs.push(m.text()));
    page.on('response', (res) => res.status() >= 400 && logs.push(`không tải được ${new URL(res.url()).pathname} (${res.status()})`));
    await page.goto(`${ORIGIN}/slide.html?${new URLSearchParams({ patch: patchId, slide: s.id })}`);
    await page.waitForFunction(() => window.__READY__ !== undefined, null, { timeout: 30000 });
    const [ready, error] = await page.evaluate(() => [window.__READY__, window.__ERROR__]);
    const issues = ready === 'error' ? [`không vẽ được: ${error}`] : [...(await page.evaluate(checkLayout)), ...logs];
    await page.close();
    if (issues.length) {
      failed++;
      console.log(`✘ ${s.id}\n${issues.map((i) => `    - ${i}`).join('\n')}`);
    } else console.log(`✔ ${s.id}`);
  }

  if (args.includes('--sheet')) {
    // Ảnh tổng hợp: lưới 4 cột các slide thu nhỏ (vẽ trực tiếp từ slide.html, luôn là bản mới nhất)
    const W = 470, H = Math.round((W * CANVAS.height) / CANVAS.width), GAP = 12, COLS = 4;
    const rows = Math.ceil(patch.slides.length / COLS);
    const page = await browser.newPage({ viewport: { width: COLS * W + (COLS + 1) * GAP, height: rows * H + (rows + 1) * GAP } });
    const frames = patch.slides
      .map((s, i) => `<iframe src="${ORIGIN}/slide.html?${new URLSearchParams({ patch: patchId, slide: s.id })}"
        style="left:${GAP + (i % COLS) * (W + GAP)}px;top:${GAP + Math.floor(i / COLS) * (H + GAP)}px"></iframe>`)
      .join('');
    await page.setContent(`<body style="margin:0;background:#0a0918">
      <style>iframe{position:absolute;width:${CANVAS.width}px;height:${CANVAS.height}px;border:0;transform:scale(${W / CANVAS.width});transform-origin:0 0}</style>
      ${frames}</body>`);
    for (const f of page.frames().slice(1)) await f.waitForFunction(() => window.__READY__ !== undefined, null, { timeout: 60000 });
    const out = path.join(ROOT, 'review', `${patchId}-tong-hop.png`);
    await mkdir(path.dirname(out), { recursive: true });
    await page.screenshot({ path: out });
    await page.close();
    console.log(`\nẢnh tổng hợp: review/${patchId}-tong-hop.png`);
  }
} finally {
  await closeBrowser();
  stop();
}
console.log(failed ? `\nCó ${failed} lỗi cần sửa.` : '\nKhông có lỗi.');
process.exitCode = failed ? 1 : 0;
