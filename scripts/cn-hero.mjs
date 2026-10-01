// Tra tên tướng tiếng Trung (trong ảnh bảng xếp hạng Tốc Chiến Trung Quốc) ra slug của dự án.
//
//   node scripts/cn-hero.mjs 辛吉德 安蓓萨 慎      → slug, tên vi-vn, đã có dữ liệu / đã đo khuôn mặt chưa
//   node scripts/cn-hero.mjs --all                 → toàn bộ bảng tên Trung → slug
import { loadHeroes, findHero, localStatus, STATUS_TEXT } from './lib/heroes.mjs';

const args = process.argv.slice(2);
const names = args.filter((a) => !a.startsWith('--'));
if (!names.length && !args.includes('--all')) {
  console.log('Cách dùng: node scripts/cn-hero.mjs <tên tiếng Trung> [...]  |  node scripts/cn-hero.mjs --all');
  process.exit(1);
}

const list = names.length ? await Promise.all(names.map(async (n) => (await findHero(n)) ?? { cn: n })) : await loadHeroes();
for (const h of list) {
  if (!h.en) { console.log(`✘ ${h.cn}: không có trong danh sách tướng CN (gõ đúng tên trong ảnh chưa?)`); process.exitCode = 1; continue; }
  if (!h.slug) { console.log(`⚠ ${h.cn} = ${h.en}: chưa có trên trang vi-vn`); continue; }
  console.log(`✔ ${h.cn} = ${h.slug} (${h.vi})${names.length ? ` · ${STATUS_TEXT[await localStatus(h.slug)]}` : ''}`);
}
