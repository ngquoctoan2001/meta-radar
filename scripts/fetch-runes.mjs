// Tải toàn bộ ngọc (符文) + phép bổ trợ (召唤师技能) của Tốc Chiến — dùng cho ảnh build.
//
//   node scripts/fetch-runes.mjs
//
// Nguồn: máy chủ Tốc Chiến Trung Quốc (game.gtimg.cn) — icon ngọc 256px, phép bổ trợ 128px, mô tả tiếng Trung.
// Tên tiếng Anh / tiếng Việt: đối chiếu với Riot Data Dragon (runesReforged, summoner — bản PC, vi_VN).
// Ngọc chỉ Tốc Chiến mới có thì không có tên Việt chính thức → "vi": null, ghi tay vào data/runes.json
// ("viManual": true để lần chạy sau không ghi đè).
//
// Kết quả: data/runes.json (runes + spells) · assets/runes/<runeId>.png · assets/spells/<key>.png
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { ROOT } from './lib/patches.mjs';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) meta-wildrift/1.0';
const CN = 'https://game.gtimg.cn/images/lgamem/act/lrlib/js';
const DD = 'https://ddragon.leagueoflegends.com';
const TYPE = { RUNE_PATH_KEY_STONE: 'keystone', RUNE_PATH_PRECISION: 'precision', RUNE_PATH_DOMINATION: 'domination', RUNE_PATH_RESOLVE: 'resolve', RUNE_PATH_SORCERY: 'sorcery' };
// Tên file icon CN không theo tên tiếng Anh → ghi tay (khoá = tên file không đuôi)
const ICON_ALIAS = {
  Keystone_hasg: 'Dark Harvest', Keystone_FleetofFoot: 'Fleet Footwork', Utility_glms: 'Axiom Arcanist', Domination_CheapSho: 'Cheap Shot',
  Defencs_Revitalize: 'Revitalize', Utility_572215001: 'Gathering Storm', Defence_CourageOfTheColossus: 'Courage of the Colossus',
  Defence_NullifyingOrb: 'Nullifying Orb', Defence_Conditioning: 'Conditioning', Utility_Detached: 'Transcendence',
  Utility_HextechFlashtraption: 'Hextech Flashtraption', Defense_Demolish: 'Demolish', Keystone_FontofLife: 'Font of Life',
};
const SPELL_KEY = { Ghost: 'ghost', Mark: 'mark', Heal: 'heal', Clarity: 'clarity', Barrier: 'barrier', Exhaust: 'exhaust', Cleanse: 'cleanse', Flash: 'flash', Ignite: 'ignite', Smite: 'smite', Teleport: 'teleport' };
// Tên tiếng Anh của phép trên Data Dragon (khác tên file video CN)
const SPELL_DD = { ghost: 'SummonerHaste', heal: 'SummonerHeal', barrier: 'SummonerBarrier', exhaust: 'SummonerExhaust', cleanse: 'SummonerBoost', flash: 'SummonerFlash', ignite: 'SummonerDot', smite: 'SummonerSmite', teleport: 'SummonerTeleport', clarity: 'SummonerMana', mark: 'SummonerSnowball' };

const key = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
async function get(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res;
}
const json = async (url) => (await get(url)).json();
const save = async (url, file) => writeFile(file, Buffer.from(await (await get(url)).arrayBuffer()));

const old = await readFile(path.join(ROOT, 'data', 'runes.json'), 'utf8').then(JSON.parse, () => ({ runes: [], spells: [] }));
const [{ runeList }, { skillList }, versions] = await Promise.all([json(`${CN}/rune/rune.js`), json(`${CN}/skill/skill.js`), json(`${DD}/api/versions.json`)]);
const v = versions[0];
const [ddEn, ddVi, sumEn, sumVi] = await Promise.all([
  json(`${DD}/cdn/${v}/data/en_US/runesReforged.json`), json(`${DD}/cdn/${v}/data/vi_VN/runesReforged.json`),
  json(`${DD}/cdn/${v}/data/en_US/summoner.json`), json(`${DD}/cdn/${v}/data/vi_VN/summoner.json`),
]);
const flat = (tree) => tree.flatMap((p) => p.slots.flatMap((s) => s.runes));
const viById = new Map(flat(ddVi).map((r) => [r.id, r.name]));
const enByKey = new Map(flat(ddEn).map((r) => [key(r.name), r]));

await mkdir(path.join(ROOT, 'assets', 'runes'), { recursive: true });
await mkdir(path.join(ROOT, 'assets', 'spells'), { recursive: true });

const runes = [];
for (const r of runeList) {
  const file = r.iconPath.split('/').pop().replace(/\.\w+$/, '');
  const guess = ICON_ALIAS[file] ?? file.replace(/^[A-Za-z]+_/, '').replace(/([a-z])([A-Z])/g, '$1 $2');
  const dd = enByKey.get(key(guess));
  const prev = old.runes.find((x) => x.id === r.runeId);
  const icon = `assets/runes/${r.runeId}.png`;
  await save(r.iconPath, path.join(ROOT, icon));
  runes.push({
    id: r.runeId,
    type: TYPE[r.type] ?? r.type,
    cn: r.name,
    en: dd?.name ?? guess,
    vi: prev?.viManual ? prev.vi : dd ? viById.get(dd.id) : null,
    ...(prev?.viManual ? { viManual: true } : {}),
    icon,
    tag: r.attrName,
    desc: r.description,
  });
}

const sumEnList = Object.values(sumEn.data);
const spells = [];
for (const s of skillList) {
  const k = SPELL_KEY[s.video?.split('/').pop().replace(/\.\w+$/, '')];
  if (!k) continue; // phép của chế độ khác (tuyết lăn…)
  const prev = old.spells.find((x) => x.key === k);
  const ddId = SPELL_DD[k];
  const icon = `assets/spells/${k}.png`;
  await save(s.iconPath, path.join(ROOT, icon));
  spells.push({
    key: k,
    id: s.skillId,
    cn: s.name,
    en: sumEnList.find((x) => x.id === ddId)?.name ?? k,
    vi: prev?.viManual ? prev.vi : sumVi.data[ddId]?.name ?? null,
    ...(prev?.viManual ? { viManual: true } : {}),
    icon,
    desc: s.funcDesc,
  });
}

await writeFile(path.join(ROOT, 'data', 'runes.json'), JSON.stringify({ source: 'game.gtimg.cn + Data Dragon ' + v, runes, spells }, null, 2) + '\n');
const missing = runes.filter((r) => !r.vi);
console.log(`✔ data/runes.json — ${runes.length} ngọc, ${spells.length} phép bổ trợ · icon trong assets/runes/, assets/spells/`);
if (missing.length) console.log(`⚠ ${missing.length} ngọc chưa có tên tiếng Việt (chỉ Tốc Chiến có): ${missing.map((r) => `${r.cn} (${r.en})`).join(', ')}`);
