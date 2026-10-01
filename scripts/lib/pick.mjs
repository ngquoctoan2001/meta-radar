// Chọn bộ ảnh liên quan theo ngày — dùng chung cho tierlist.mjs và champ-build.mjs.
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { ROOT } from './patches.mjs';

const tryJSON = (p) => readFile(path.join(ROOT, p), 'utf8').then(JSON.parse, () => null);
export const DAY = 86400000;

// "30/09/2026" → Date (UTC) | null
export function parseVN(d) {
  const m = String(d ?? '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  return m ? new Date(Date.UTC(+m[3], +m[2] - 1, +m[1])) : null;
}
// "2026-10-07" → { date, vn: "07/10/2026", dm: "07/10" } | null
export function parseISO(day) {
  const m = String(day).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const date = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  if (date.getUTCMonth() !== +m[2] - 1) return null;
  return { date, vn: `${m[3]}/${m[2]}/${m[1]}`, dm: `${m[3]}/${m[2]}` };
}

const verKey = (id) => id.split(/(\d+)/).filter(Boolean).map((p) => (/^\d+$/.test(p) ? p.padStart(4, '0') : p)).join('');
export async function listDirs(dir) {
  return (await readdir(path.join(ROOT, dir), { withFileTypes: true }).catch(() => [])).filter((d) => d.isDirectory()).map((d) => d.name);
}

// Bản cập nhật áp dụng cho ngày `date`: bản có "date" (ngày ra) gần nhất không sau `date`.
// Chưa bản nào ghi ngày → lấy bản số hiệu cao nhất (và báo để bổ sung ngày).
export async function pickPatch(date) {
  const patches = [];
  for (const id of await listDirs('patches')) {
    const p = await tryJSON(`patches/${id}/patch.json`);
    if (p) patches.push({ id: p.id, date: parseVN(p.date) });
  }
  const dated = patches.filter((p) => p.date && p.date <= date).sort((a, b) => b.date - a.date);
  if (dated.length) return { ...dated[0], why: 'bản ra gần nhất trước ngày này' };
  const latest = patches.sort((a, b) => verKey(b.id).localeCompare(verKey(a.id)))[0];
  return latest ? { ...latest, why: 'số hiệu cao nhất — các patch.json chưa ghi "date" (ngày ra)' } : null;
}

// Tier list mới nhất không sau `date` (cùng bộ lọc nếu có) → { id, data } | null
export async function pickTierlist(date, filter) {
  const all = [];
  for (const dir of await listDirs('tierlists')) {
    const t = await tryJSON(`tierlists/${dir}/tierlist.json`);
    if (t && parseVN(t.date) && parseVN(t.date) <= date && (!filter || t.filter === filter)) all.push({ id: t.id, date: parseVN(t.date), data: t });
  }
  return all.sort((a, b) => b.date - a.date || b.id.localeCompare(a.id))[0] ?? null;
}
