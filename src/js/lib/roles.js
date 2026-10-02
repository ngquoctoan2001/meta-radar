// Vai trò của bộ build (mỗi ngày + vai trò = 1 bộ ảnh, vd "01/10 · ADC").
// Dùng được cả ở trình duyệt lẫn Node (không import gì).
export const ROLES = {
  adc: { name: 'ADC', lane: 'dragon' },
  top: { name: 'TOP', lane: 'baron' },
  jungle: { name: 'RỪNG', lane: 'jungle' },
  mid: { name: 'MID', lane: 'mid' },
  sp: { name: 'SP', lane: 'support' },
};
// Số tướng trên 1 ảnh tổng quan của bộ build; bộ nhiều tướng hơn thì có thêm ảnh tổng quan thứ 2, 3…
export const OVERVIEW_SIZE = 6;
export const roleOfLane =(lane) => Object.entries(ROLES).find(([, r]) => r.lane === lane)?.[0] ?? null;

// "KOG'MAW" → "Kog'Maw", "JARVAN IV" → "Jarvan IV", "DR. MUNDO" → "Dr. Mundo"
export const titleCase = (s) =>
  String(s).toLowerCase()
    .replace(/(^|[\s'.&-])(\p{L})/gu, (m, a, c) => a + c.toUpperCase())
    .replace(/(\s)(i{1,3}|iv|vi{0,3}|ix|x)\b/gi, (m, sp, r) => sp + r.toUpperCase());
