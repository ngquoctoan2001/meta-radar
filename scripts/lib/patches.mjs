// Đọc danh mục patch + danh sách ảnh từ thư mục patches/.
// Dùng chung cho server (GET /api/patches) và bản build tĩnh (patches/index.json).
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export const readJSON = async (p) => JSON.parse(await readFile(path.join(ROOT, p), 'utf8'));
const tryJSON = (p) => readJSON(p).catch(() => null);

// So sánh số phiên bản kiểu 7.3a > 7.2b > 7.2
const verKey = (id) => id.split(/(\d+)/).filter(Boolean).map((p) => (/^\d+$/.test(p) ? p.padStart(4, '0') : p)).join('');

export async function listPatches() {
  const dirs = await readdir(path.join(ROOT, 'patches'), { withFileTypes: true });
  const patches = [];
  for (const d of dirs.filter((x) => x.isDirectory())) {
    const patch = await tryJSON(`patches/${d.name}/patch.json`);
    if (!patch) continue;
    const slides = [];
    for (const [i, s] of patch.slides.entries()) {
      let label = s.title ?? s.id;
      let status = null;
      if (s.type === 'champion') {
        const c = await tryJSON(`data/champions/${s.ref}.json`);
        label = c?.name ?? s.ref;
        status = patch.champions.find((x) => x.slug === s.ref)?.status ?? null;
      } else if (s.type === 'item') {
        const it = await tryJSON(`data/items/${s.ref}.json`);
        label = it?.name ?? s.ref;
        status = patch.items.find((x) => x.slug === s.ref)?.status ?? null;
      }
      slides.push({ ...s, label, status, index: i });
    }
    const count = (st) => patch.champions.filter((c) => c.status === st).length;
    patches.push({
      id: patch.id,
      title: patch.title,
      date: patch.date,
      headline: patch.headline,
      sourceFile: patch.sourceFile,
      counts: { buff: count('buff'), nerf: count('nerf'), mixed: count('adjust') + count('mixed'), items: patch.items?.length ?? 0, systems: patch.systems?.length ?? 0 },
      slides,
    });
  }
  return patches.sort((a, b) => verKey(b.id).localeCompare(verKey(a.id)));
}
