// Phân tích giá trị "cũ → mới" trong patch và suy ra buff/nerf cho từng dòng.
//
// Hỗ trợ các dạng:
//   "128"              1 giá trị
//   "50/75/100/125%"   theo cấp kỹ năng
//   "3,5%–10,5%"       khoảng (tối thiểu–tối đa)
//   "22/20/18/16 giây" có đơn vị
//   "3.200"            dấu chấm hàng nghìn kiểu VN · "5,5" dấu phẩy thập phân
// Không phân tích được → kind "text", cần ghi `effect` trong patch.json.

// Chỉ số mà GIẢM mới là BUFF (so khớp trên nhãn đã bỏ dấu, theo nguyên từ: "giá" ≠ "giáp").
const INVERSE_PATTERNS = [/\bhoi chieu\b/, /^gia\b/, /\btieu hao\b/, /\bnguong\b/, /\bthoi gian van\b/];

export const norm = (s) =>
  String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase();

export function toNumber(token) {
  let t = token.replace('%', '').trim();
  if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, '');
  const n = Number(t.replace(',', '.'));
  return t !== '' && Number.isFinite(n) ? n : null;
}

export function parseValue(raw) {
  const text = String(raw ?? '').trim();
  let unit = '';
  let body = text;
  const unitMatch = body.match(/\s*(giây|vàng|s)\s*$/i);
  if (unitMatch) {
    unit = unitMatch[1];
    body = body.slice(0, unitMatch.index);
  }
  const percent = body.includes('%');
  const num = String.raw`\d[\d.,]*%?`;
  let kind = 'text';
  let parts = [];
  if (new RegExp(`^${num}$`).test(body)) {
    kind = 'single';
    parts = [body];
  } else if (new RegExp(`^${num}(\\s*/\\s*${num})+$`).test(body)) {
    kind = 'ranks';
    parts = body.split('/').map((p) => p.trim());
  } else if (new RegExp(`^${num}\\s*[–-]\\s*${num}$`).test(body)) {
    kind = 'range';
    parts = body.split(/[–-]/).map((p) => p.trim());
  }
  const nums = parts.map(toNumber);
  if (kind !== 'text' && nums.some((n) => n === null)) kind = 'text';
  return { text, kind, nums: kind === 'text' ? [] : nums, parts, unit, percent };
}

export const isInverse = (line) => line.inverse ?? INVERSE_PATTERNS.some((re) => re.test(norm(line.label)));

// Chênh lệch theo từng phần tử. Một vế chỉ có 1 số thì áp cho mọi cấp (vd "20/25/30/35%" → "25%").
export function diffs(oldV, newV) {
  if (oldV.kind === 'text' || newV.kind === 'text') return null;
  let a = oldV.nums;
  let b = newV.nums;
  if (a.length === 1 && b.length > 1) a = b.map(() => a[0]);
  if (b.length === 1 && a.length > 1) b = a.map(() => b[0]);
  if (a.length !== b.length) return null;
  return b.map((x, i) => ({ from: a[i], to: x, d: round(x - a[i]) }));
}

const round = (n) => Math.round(n * 10000) / 10000;
const sign = (d, inverse) => Math.sign(d) * (inverse ? -1 : 1);
const effectOfSigns = (signs) => {
  if (signs.every((s) => s === 0)) return 'neutral';
  if (signs.every((s) => s >= 0)) return 'buff';
  if (signs.every((s) => s <= 0)) return 'nerf';
  return 'mixed';
};

export function analyzeLine(line) {
  const oldV = parseValue(line.old);
  const newV = parseValue(line.new);
  const ds = line.text ? null : diffs(oldV, newV);
  const inverse = isInverse(line);
  const cellEffects = ds ? ds.map(({ d }) => effectOfSigns([sign(d, inverse)])) : null;
  const effect = line.effect ?? (ds ? effectOfSigns(ds.map(({ d }) => sign(d, inverse))) : 'neutral');
  return { oldV, newV, ds, inverse, effect, cellEffects, delta: line.delta ?? deltaText(oldV, newV, ds) };
}

export function groupEffect(lines) {
  const effects = lines.map((l) => analyzeLine(l).effect).filter((e) => e !== 'neutral');
  if (!effects.length) return 'neutral';
  if (effects.every((e) => e === 'buff')) return 'buff';
  if (effects.every((e) => e === 'nerf')) return 'nerf';
  return 'mixed';
}

export const fmt = (n, digits = 3) => n.toLocaleString('vi-VN', { maximumFractionDigits: digits });
const signed = (d) => (d > 0 ? '+' : d < 0 ? '−' : '±') + fmt(Math.abs(d));

// Nhãn chênh lệch ngắn gọn hiển thị bên phải mỗi dòng.
export function deltaText(oldV, newV, ds) {
  if (!ds || !ds.length) return '';
  const unit = newV.percent ? '%' : newV.unit ? ` ${newV.unit}` : '';
  const kind = newV.kind === 'single' && oldV.kind !== 'single' ? oldV.kind : newV.kind;
  if (kind === 'single') return ds[0].d === 0 ? '' : signed(ds[0].d) + unit;
  if (kind === 'range') {
    if (ds.some(({ from }) => from === 0)) return '';
    const ratios = ds.map(({ from, to }) => to / from);
    const spread = Math.max(...ratios) - Math.min(...ratios);
    if (spread > 0.1) return '';
    const avg = ratios.reduce((s, r) => s + r, 0) / ratios.length;
    return avg === 1 ? '' : `×${fmt(avg, 1)}`;
  }
  // theo cấp: chỉ ghi khi mọi cấp đổi cùng một lượng
  const first = ds[0].d;
  if (first !== 0 && ds.every(({ d }) => d === first)) return `${signed(first)}${unit} mọi cấp`;
  return '';
}
