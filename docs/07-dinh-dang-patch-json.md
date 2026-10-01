# 07 — Định dạng `patch.json`

Mỗi bản cập nhật là một thư mục `patches/<bản>/`:

```
patches/7.3a/
├─ source.md     bản dịch gốc (bạn cung cấp)
├─ patch.json    dữ liệu để vẽ ảnh
└─ out/          PNG đã xuất (tự tạo, 3840×2160): 7.3a-02-samira.png
```

Trang quản lý tự quét thư mục `patches/`. Có `patch.json` hợp lệ là patch hiện lên danh mục.

## Khung tổng

```jsonc
{
  "id": "7.3a",                       // tên thư mục, hiện trên mọi ảnh
  "title": "Bản cập nhật 7.3a",
  "date": "29/09/2026",               // ngày ra bản cập nhật — tier list dùng để chọn bản & tính số ngày
  "sourceFile": "patches/7.3a/source.md",
  "headline": "Xạ thủ trỗi dậy · Rừng chậm lại · Nexus mỏng hơn",   // dòng tiêu đề ảnh tổng quan, ngăn bằng " · "
  "systemsVerdict": "…",              // câu chốt của ảnh "Khác"

  "champions": [ /* xem bên dưới */ ],
  "items":     [ /* xem bên dưới */ ],
  "systems":   [ /* xem bên dưới */ ],

  "slides": [                         // ảnh nào được vẽ, theo thứ tự đăng
    { "id": "overview", "type": "overview", "title": "Tổng quan" },
    { "id": "samira", "type": "champion", "ref": "samira" },
    { "id": "yun-tal-wildarrows", "type": "item", "ref": "yun-tal-wildarrows" },
    { "id": "systems", "type": "system", "title": "Hệ thống & bản đồ" }
  ]
}
```

## Tướng

```jsonc
{
  "slug": "samira",                   // trùng tên file data/champions/samira.json
  "status": "buff",                   // buff | nerf | adjust | rework | new
  "reason": "…",                      // lý do (lưu tham khảo, không in lên ảnh)
  "verdict": "Trâu hơn, đau hơn: …",  // CÂU CHỐT — nên ≤ 20 từ
  "changes": [
    { "key": "stats", "name": "Chỉ số cơ bản", "lines": [ … ] },
    { "key": "p", "note": "Sát thương cận chiến", "lines": [ … ] },   // note: nhãn nhỏ cạnh tên kỹ năng
    { "key": "q", "lines": [ … ] },
    { "key": "q", "badge": "QQ", "name": "Tai Ương – Lửa Tàn Phá", "lines": [ … ] }  // chiêu biến thể (Hwei)
  ]
}
```

- `key`:
  - `stats` là chỉ số cơ bản.
  - `p`, `q`, `w`, `e`, `r` lần lượt là nội tại, Q, W, E, R.
  - Icon và tên kỹ năng tự lấy từ `data/champions/<slug>.json`. Chỉ cần ghi `name` khi muốn đổi tên hiển thị.
- `badge`: chữ trên icon kỹ năng. Mặc định là key viết hoa.

## Một dòng thay đổi (`lines[]`)

```jsonc
{ "label": "Tỷ lệ AD", "old": "110%", "new": "125%" }
```

| Dạng giá trị | Ví dụ | Máy tự hiểu |
|---|---|---|
| 1 số | `"128"` → `"136"` | chênh lệch `+8` |
| Phần trăm | `"110%"` → `"125%"` | `+15%` |
| Theo cấp | `"50/75/100/125%"` → `"60/80/100/120%"` | tô màu từng cấp |
| Cấp → 1 số | `"20/25/30/35%"` → `"25%"` | áp 25% cho mọi cấp |
| Khoảng | `"3,5%–10,5%"` → `"5,8%–17%"` | hệ số nhân `×1,6` |
| Có đơn vị | `"20 giây"` → `"25 giây"` | `+5 giây` |
| Số kiểu VN | `"3.200"`, `"5,5"` | dấu chấm hàng nghìn, dấu phẩy thập phân |

Trường tuỳ chọn:
- `"effect": "buff" | "nerf" | "neutral"` — ép kết luận khi máy hiểu sai hoặc giá trị không phải số. Ví dụ Nhà Chính giảm máu là thay đổi trung tính.
- `"inverse": true` — chỉ số mà giảm mới là buff. Máy đã tự nhận các nhãn *Hồi chiêu, Giá, Tiêu hao, Ngưỡng, Thời gian vận*.
- `"delta": "…"` — tự ghi nhãn chênh lệch.
- `"text": "…"` — dòng mô tả không có số, thay cho `old`/`new`.

Giá trị phức tạp như `"50/90/130/170 + 75% AP"` nên **tách thành nhiều dòng** (sát thương cơ bản / tỷ lệ AP) để máy so sánh được.

## Trang bị

```jsonc
{
  "slug": "yun-tal-wildarrows",       // trùng tên file data/items/<slug>.json
  "status": "buff",
  "verdict": "…",
  "changes": [
    { "key": "stats", "name": "Chỉ số cơ bản", "lines": [ … ] },
    { "key": "passive", "name": "Chuyển Động Liên Hoàn", "nameEn": "Flurry", "lines": [ … ] }
  ]
}
```

Nếu dòng `stats` trùng nhãn với `stats` trong `data/items/<slug>.json` (vd "Tốc độ đánh"), ô **"Sau cập nhật"** sẽ tự hiện giá trị mới.

## Hệ thống / bản đồ

```jsonc
{
  "slug": "nexus", "name": "Nhà Chính",
  "iconSvg": "nexus",                 // nexus | tower | shield — hoặc "icon": "assets/icons/smite.png"
  "status": "adjust",
  "summary": "Trận đấu kết thúc nhanh hơn",
  "lines": [ { "label": "Máu tối đa", "old": "5.500", "new": "4.000", "effect": "neutral" } ]
}
```

## Căn khung splash của tướng

Trong `data/champions/<slug>.json`:

```json
"layout": { "focusX": 0.62 }
```

- `focusX` là **vị trí ngang của khuôn mặt tướng trong ảnh splash**: 0 là mép trái, 1 là mép phải.
- Máy tự tính khung sao cho khuôn mặt nằm ở cùng một chỗ trên mọi ảnh tướng. Cách này đúng với mọi nguồn ảnh và tỉ lệ ảnh (1280×720 hay 2436×1124).
- Tướng đứng sát mép phải ảnh gốc (vd Caitlyn) thì khung dừng ở mép, khuôn mặt lệch phải một chút.
- Chạy lại `fetch-champion.mjs` **không xoá** phần `layout`.

## Lưu ý khi ảnh chật

- Tướng có quá nhiều thay đổi thì ảnh tự chuyển sang chế độ gọn. Nếu vẫn không đủ chỗ, trang quản lý sẽ hiện cảnh báo, khi đó nên tách thành 2 ảnh.
- Số liệu dài (theo cấp, nhiều mốc như `40/60/80/100/120`) → thẻ tự đưa nhãn lên 1 dòng riêng, rồi co cỡ số nếu vẫn chật.
- Câu chốt nên gọn trong **2–3 dòng**. Nếu chạm chân ảnh, ảnh tự thu nhỏ biểu tượng/tên. Vẫn không vừa thì trang quản lý báo "Câu chốt quá dài".
- Đổi thứ tự ảnh trong `slides` rồi xuất toàn bộ → ảnh mang số thứ tự cũ trong `out/` được tự xoá.
