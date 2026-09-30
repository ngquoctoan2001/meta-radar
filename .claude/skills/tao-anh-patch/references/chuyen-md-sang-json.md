# Chuyển bản dịch .md → patch.json

Bản dịch của người dùng viết tự do (tiêu đề, gạch đầu dòng, bảng, mũi tên, emoji). Dưới đây là các dạng đã gặp và cách chuyển. Ví dụ đầy đủ: `patches/7.3a/source.md` → `patches/7.3a/patch.json`.

## Mục lục
1. Nhóm trạng thái
2. Khối một tướng
3. Dòng số liệu — các dạng
4. Trang bị
5. Hệ thống / bản đồ
6. Những thứ KHÔNG đưa vào JSON

## 1. Nhóm trạng thái

| Trong .md | `status` |
|---|---|
| "TƯỚNG ĐƯỢC BUFF", "— BUFF", 🟢 | `buff` |
| "TƯỚNG BỊ NERF", "— NERF", 🔴 | `nerf` |
| "điều chỉnh", vừa tăng vừa giảm và bản dịch không kết luận | `adjust` |
| "làm lại" (rework) | `rework` |
| tướng mới ra | `new` |

Trang bị: bản dịch thường ghi "Tổng thể: thiên về buff" / "Nerf." → dùng đúng kết luận đó. Không có kết luận → tự đánh giá từ số liệu, nói rõ với người dùng.

## 2. Khối một tướng

```md
1. SAMIRA — BUFF
Samira đang yếu ở nhiều mức kỹ năng, ... nên được tăng cả độ cứng cáp và sát thương. Wild Rift Fire
Chỉ số cơ bản
Chỉ số	Trước	Sau
Máu tăng mỗi cấp	128	136 ↑
Nội tại — Thích Thể Hiện (Daredevil Impulse)
Sát thương cận chiến được tăng:
- Tỷ lệ AD tối thiểu: 3,5%–10,5% → 5,8%–17%
Q — Ứng Biến (Flair)
- Tỷ lệ AD: 110% → 125%
➡️ Q gây sát thương mạnh hơn đáng kể.
```
→
```json
{
  "slug": "samira",
  "status": "buff",
  "reason": "Samira đang yếu ở nhiều mức kỹ năng, ... nên được tăng cả độ cứng cáp và sát thương.",
  "verdict": "…",
  "changes": [
    { "key": "stats", "name": "Chỉ số cơ bản", "lines": [ { "label": "Máu mỗi cấp", "old": "128", "new": "136" } ] },
    { "key": "p", "note": "Sát thương cận chiến", "lines": [ { "label": "Tỷ lệ AD tối thiểu", "old": "3,5%–10,5%", "new": "5,8%–17%" } ] },
    { "key": "q", "lines": [ { "label": "Tỷ lệ AD", "old": "110%", "new": "125%" } ] }
  ]
}
```

- `key`: `stats` (chỉ số cơ bản), `p` (nội tại), `q`, `w`, `e`, `r`. Bản dịch có thể ghi "Chiêu 1/2/3/cuối" → `q/w/e/r`.
- **Không cần ghi `name` cho kỹ năng**: tên + icon tự lấy từ `data/champions/<slug>.json` (tên chính thức tiếng Việt). Chỉ ghi `name` khi là biến thể không có icon riêng.
- `note`: ngữ cảnh ngắn đứng cạnh tên kỹ năng ("Sát thương cận chiến", "Hồi máu", "Dạng rồng"…). Tùy chọn.
- Kỹ năng biến thể / tổ hợp (Hwei QQ, QW; Jayce dạng búa/súng; Nidalee dạng người/báo): `key` là phím gốc để lấy icon, thêm `badge` và `name`:
  ```json
  { "key": "q", "badge": "QQ", "name": "Tai Ương – Lửa Tàn Phá", "lines": [ … ] }
  ```
- Thứ tự `changes` theo thứ tự trong .md (thường: chỉ số → nội tại → Q → W → E → R).

## 3. Dòng số liệu — các dạng

Luôn `{ "label": "...", "old": "...", "new": "..." }`, một chỉ số một dòng. Bỏ ký hiệu ↑ ↓ khỏi giá trị.

**Nhãn**: giữ đúng chữ của bản dịch (AD, AP, giáp, kháng phép…), viết hoa chữ đầu. Chỉ rút gọn chữ thừa để vừa ảnh — "Máu tăng mỗi cấp" → "Máu mỗi cấp", "Tỷ lệ AD của sát thương lặp lại" → "Tỷ lệ AD (sát thương lặp lại)". **Đừng bỏ** chữ mang nghĩa như "cơ bản", "cộng thêm", "tối đa", "mỗi cấp" ("Giáp cơ bản" giữ nguyên, khác với "Giáp mỗi cấp").

| Trong .md | JSON |
|---|---|
| `- Tỷ lệ AD: 110% → 125%` | `{ "label": "Tỷ lệ AD", "old": "110%", "new": "125%" }` |
| Bảng `Giáp tăng mỗi cấp  5  5,5 ↑` | `{ "label": "Giáp mỗi cấp", "old": "5", "new": "5,5" }` |
| Tiêu đề rồi dòng giá trị: `Tốc độ đánh:` / `50/75/100/125% → 60/80/100/120%` | `{ "label": "Tốc độ đánh", "old": "50/75/100/125%", "new": "60/80/100/120%" }` |
| `Hồi chiêu: 22/20/18/16 giây → 20/18/16/14 giây` | giữ `giây` trong cả 2 vế |
| `Làm chậm: 20/25/30/35% → 25% cố định` | `"new": "25%"` (1 số = áp cho mọi cấp) |
| `Ngưỡng nâng cấp: 40/60/80/100/120 → 50/75/100/125/150` | giữ nguyên (tự hiểu tăng ngưỡng = nerf) |
| `Giá: 3.200 → 3.300 vàng` | `"old": "3.200", "new": "3.300"` |

**Giá trị gộp → tách dòng**, bỏ phần không đổi:
```md
Sát thương:
50/90/130/170 + 75% AP + 4/5/6/7% máu tối đa
→
50/85/120/155 + 70% AP + 4/5/6/7% máu tối đa
```
→
```json
{ "label": "Sát thương cơ bản", "old": "50/90/130/170", "new": "50/85/120/155" },
{ "label": "Tỷ lệ AP", "old": "75%", "new": "70%" }
```
Tương tự `3%–4,5% máu + 0,5% AP → 4,5%–6% máu + 0,2% AP` → dòng "Hồi máu theo % máu" và dòng "Tỷ lệ AP". Khoảng theo cấp tướng `33–333 theo cấp` → `"old": "33–333"`, ghi "theo cấp" vào nhãn ("Sát thương theo cấp").

**Thay đổi không có số** (cơ chế, mô tả):
```json
{ "label": "Thời gian ra đòn", "text": "Tốc đánh cộng thêm giảm thời gian ra đòn kém hiệu quả hơn", "effect": "nerf" }
```

**Khi nào ghi `effect`** (`buff` | `nerf` | `neutral`): chỉ khi con số không nói lên hướng.
- Nhà Chính giảm máu → `neutral` (thay đổi luật chơi, không buff/nerf ai).
- Giáp trụ: lượng giáp/kháng nhận được giảm, thời gian tồn tại giảm → tùy cách nhìn; bản 7.3a ghi `neutral` cho cả hai.
- Dòng `text` → luôn cần `effect`.
- Bản dịch cảnh báo "đừng nhìn riêng con số" (vd Senna 0,6 → 1,1 thật ra là phần của nerf) → vẫn để dòng tự tô theo số, và nói rõ trong câu chốt.

Chạy `node scripts/audit.mjs <id>`: dòng nào không so sánh tự động được sẽ bị báo `⚠` → tách dòng hoặc thêm `effect`.

## 4. Trang bị

```md
Yun Tal Wildarrows
- Tốc đánh: 25% → 35%
- Nội tại Flurry – tốc đánh: 25% → 35%
- Hồi chiêu: 20 → 25 giây
- Tổng thể: thiên về buff.
```
→
```json
{
  "slug": "yun-tal-wildarrows",
  "status": "buff",
  "verdict": "…",
  "changes": [
    { "key": "stats", "name": "Chỉ số cơ bản", "lines": [ { "label": "Tốc độ đánh", "old": "25%", "new": "35%" } ] },
    { "key": "passive", "name": "Chuyển Động Liên Hoàn", "nameEn": "Flurry", "lines": [
      { "label": "Tốc độ đánh cộng thêm", "old": "25%", "new": "35%" },
      { "label": "Hồi chiêu", "old": "20 giây", "new": "25 giây" }
    ]}
  ]
}
```
- `key`: `stats` (chỉ số, giá) hoặc `passive` (nội tại/kích hoạt).
- Tên nội tại tiếng Việt: xem `passives` trong `data/items/<slug>.json` (lấy từ Riot vi_VN). Tên tiếng Anh trong .md → `nameEn`.
- Nhãn chỉ số trong nhóm `stats` nên trùng nhãn trong `data/items/<slug>.json` ("Tốc độ đánh", "Sức mạnh công kích"…) để ô "Sau cập nhật" tự hiện giá trị mới.
- Giá: dòng `{ "label": "Giá", "old": "3.400", "new": "3.300" }`. Đổi cả chỉ số lẫn giá → để chung một nhóm `stats` "Chỉ số cơ bản" (một thẻ gọn). Chỉ đổi giá → nhóm `stats` tên "Giá" (như Death's Dance 7.3a).
- Slug do `fetch-item.mjs` tạo từ tên tiếng Anh (vd Death's Dance → `deaths-dance`, kể cả khi bản dịch chỉ ghi "Vũ Điệu Tử Thần").

## 5. Hệ thống / bản đồ

```md
Trừng Phạt (Smite): sát thương đốt lên quái rừng mỗi giây giảm từ 30–198 → 22–162.
Nexus: máu tối đa 5.500 → 4.000.
```
→
```json
"systems": [
  { "slug": "smite", "name": "Trừng Phạt", "icon": "assets/icons/smite.png", "status": "nerf",
    "summary": "Dọn rừng chậm hơn",
    "lines": [ { "label": "Sát thương đốt lên quái / giây", "old": "30–198", "new": "22–162" } ] },
  { "slug": "nexus", "name": "Nhà Chính", "iconSvg": "nexus", "status": "adjust",
    "summary": "Trận đấu kết thúc nhanh hơn",
    "lines": [ { "label": "Máu tối đa", "old": "5.500", "new": "4.000", "effect": "neutral" } ] }
]
```
- `summary`: cụm ngắn **≤ ~30 ký tự** nói hệ quả (bản dịch hay có ở dòng "Mục đích là…" / "➡️"), vd "Dọn rừng chậm hơn".
- `status` của hệ thống: nhìn từ chính thứ bị đổi — phép/trang bị/công trình mạnh lên → `buff`, yếu đi → `nerf` (vd Tốc Biến hồi lâu hơn → `nerf`); thay đổi luật chơi không nghiêng về ai (máu Nhà Chính, thời gian hồi sinh…) → `adjust` + dòng `"effect": "neutral"`. Bản dịch có kết luận thì theo bản dịch.
- Có thay đổi hệ thống → thêm `"systemsVerdict"` ở gốc JSON và ảnh `{ "id": "systems", "type": "system", "title": "Hệ thống & bản đồ" }` cuối `slides`.
- Ngọc bổ trợ, chế độ chơi: đưa vào `systems` theo cùng khuôn (icon phù hợp hoặc `iconSvg: "shield"`).

## 6. Những thứ KHÔNG đưa vào JSON
- Tên nguồn trong câu ("Wild Rift Fire", link).
- Dòng `➡️ …` và "Lưu ý…", "Tức là: - cấp 1: … buff": đây là diễn giải của người dịch. Máy đã tự tô màu từng cấp; dùng các ý này để **viết câu chốt**.
- Bảng "Tóm tắt nhanh" cuối file: chỉ để đối chiếu xem đã sót tướng nào chưa.
