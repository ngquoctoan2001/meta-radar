# 03 — Thiết kế hình ảnh

## 1. Thông số chung

| Thông số | Giá trị | Ghi chú |
|---|---|---|
| Kích thước | **1920 × 1080** (16:9) | Có thể xuất ở tỉ lệ 2x (3840×2160) nếu muốn nét hơn. Facebook sẽ nén lại |
| Lề an toàn | **80px** mỗi cạnh | Không đặt chữ quan trọng sát mép |
| Định dạng xuất | PNG | Ảnh có chữ thì PNG nét hơn JPG |
| Nền | Tối (xanh đen) | Hợp tông game, làm nổi màu buff/nerf và splash art |
| Cỡ chữ tối thiểu | **36px** (chữ phụ), **44px** (số liệu), **72px+** (tên tướng) | Trên điện thoại, ảnh bị thu nhỏ còn khoảng 20% (xem [01](01-phan-tich-y-tuong.md#tiktok)) |
| Lượng chữ | Mỗi ảnh ≤ **~40 từ** (không tính số) | Câu chốt ≤ **20 từ** |

## 2. Hệ màu trạng thái

| Trạng thái | Màu | Ký hiệu | Dùng khi |
|---|---|---|---|
| **BUFF** | Xanh lá `#22C55E` | ▲ | Nhìn chung tướng/trang bị mạnh lên |
| **NERF** | Đỏ `#EF4444` | ▼ | Nhìn chung yếu đi |
| **ĐIỀU CHỈNH** | Vàng hổ phách `#F59E0B` | ⇄ | Vừa tăng vừa giảm, khó nói mạnh hay yếu |
| **LÀM LẠI / MỚI** | Tím `#A855F7` | ✦ | Làm lại bộ kỹ năng, tướng mới, trang bị mới |
| **SỬA LỖI** | Xám `#94A3B8` | ● | Chỉ sửa lỗi, không đổi sức mạnh |

- **Không chỉ dựa vào màu.** Khoảng 8% nam giới mù màu đỏ–xanh lá, nên luôn kèm **mũi tên ▲▼ và chữ BUFF/NERF**.
- Có thể thêm **mức độ** bằng số mũi tên: `▲` nhẹ, `▲▲` vừa, `▲▲▲` mạnh. Xem câu hỏi ở [06](06-lo-trinh-va-cau-hoi.md#cau-hoi-can-ban-chot).
- **Mỗi dòng số liệu** cũng có màu riêng, vì một skill có thể vừa buff vừa nerf. Ví dụ Kayle 7.2b: năng lượng tiêu hao `80/85/90/95 → 70/80/90/100` thì cấp 1–2 là buff, cấp 3 giữ nguyên, cấp 4 là nerf.
- ⚠️ **Chỉ số ngược:** các chỉ số sau **giảm là BUFF**: Hồi chiêu, Năng lượng tiêu hao, Giá, Thời gian vận chiêu. Các chỉ số còn lại tăng là buff.

## 3. Nhận diện thương hiệu (đề xuất)

| Thành phần | Đề xuất |
|---|---|
| Màu nền | `#0A0E1A` (xanh đen) → gradient `#111827` |
| Màu nhấn thương hiệu | Vàng Hextech `#C8AA6E` (gợi cảm giác LMHT mà không dùng logo Riot) |
| Màu nhấn theo tướng | Lấy `colors.primary` có sẵn trong dữ liệu ảnh (xem [02](02-nguon-du-lieu-va-anh.md#sanity)). Dùng cho gradient nền và viền sáng |
| Logo kênh | Góc trên trái, **cùng một vị trí trên mọi ảnh** |
| Ô số patch | `7.2b`: viền vàng, góc trên, luôn hiện |
| Chân ảnh | `@handle` + `Hình ảnh © Riot Games` (chữ nhỏ, mờ) |

### Font chữ (phải hỗ trợ tiếng Việt)

| Vai trò | Font (Google Fonts, có bộ ký tự `vietnamese`) | Lý do |
|---|---|---|
| Tiêu đề, tên tướng | **Oswald** hoặc **Anton** | Chữ đứng, đậm, chất "game/thể thao" |
| Nội dung | **Be Vietnam Pro** | Font làm cho tiếng Việt, dấu rất đẹp |
| Số liệu | **Barlow Condensed** + `font-variant-numeric: tabular-nums` | Chữ số rộng bằng nhau nên các cột số thẳng hàng |

- Tải font về máy (`assets/fonts/`), không lấy từ Google lúc render, tránh lỗi mạng làm sai font.
- Thử kỹ chữ có dấu chồng như **Ệ, Ỗ, Ữ, Ặ**. Font chữ đứng hay bị cắt dấu → đặt `line-height ≥ 1.15`.

## 4. Ảnh TỔNG QUAN

### Phương án A — Chia cột theo trạng thái (đề xuất làm trước)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [LOGO]  CẬP NHẬT 7.2b                                            29.07.2026  │ 7.2b │  │
│         10 tướng · 5 trang bị                                                           │
├──────────────────────────────┬──────────────────────────────┬──────────────────────────┤
│ ▲ BUFF  (3)                  │ ▼ NERF  (6)                  │ ⇄ ĐIỀU CHỈNH  (1)        │
│ ┌──────┐┌──────┐┌──────┐     │ ┌──────┐┌──────┐┌──────┐     │ ┌──────┐                 │
│ │ảnh   ││ảnh   ││ảnh   │     │ │ảnh   ││ảnh   ││ảnh   │     │ │ảnh   │                 │
│ │Aurora││ Ekko ││LeeSin│     │ │Jayce ││Nida. ││Ambes.│     │ │Kayle │                 │
│ └──────┘└──────┘└──────┘     │ └──────┘└──────┘└──────┘     │ └──────┘                 │
│                              │ ┌──────┐┌──────┐┌──────┐     │                          │
│                              │ │ Sona ││Hecar.││Zilean│     │                          │
│                              │ └──────┘└──────┘└──────┘     │                          │
├──────────────────────────────┴──────────────────────────────┴──────────────────────────┤
│ TRANG BỊ  [icon] Găng Tay Băng Giá ▲  [icon] Vọng Âm Luden ▲  [icon] Súng Từ Trường ▲ … │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ @tenkenh · Hình ảnh © Riot Games                                  Lướt để xem chi tiết →│
└────────────────────────────────────────────────────────────────────────────────────────┘
```
*(Cách phân loại trong hình chỉ là ví dụ, mình tự đánh giá từ số liệu 7.2b.)*

- Ô tướng dùng **ảnh chân dung 285×323**. Có viền màu theo trạng thái, tên tướng ở dưới.
- Cột nào không có tướng thì **ẩn đi**, các cột còn lại tự giãn ra.
- **Bố cục tự co giãn theo số lượng** (làm bằng CSS Grid + JS):

| Tổng số tướng | Kích thước ô | Ghi chú |
|---|---|---|
| ≤ 6 | Lớn (~220px) | Có chỗ ghi 1 dòng tóm tắt dưới tên |
| 7 – 14 | Vừa (~160px) | Như ví dụ 7.2b |
| 15 – 24 | Nhỏ (~120px) | Chỉ ảnh + tên |
| > 24 | Tách thành **2 ảnh tổng quan** | Ảnh 1: tướng · Ảnh 2: trang bị, ngọc, hệ thống |

### Phương án B — "Thang đo" từ nerf nặng đến buff mạnh

```
  NERF NẶNG ◄━━━━━━━━━━━━━━━━━━━━━━━━━━━━┿━━━━━━━━━━━━━━━━━━━━━━━━━━━━► BUFF MẠNH
    [Ambessa]   [Sona] [Zilean]   [Jayce] [Nidalee] [Hecarim]  [Kayle]  [Aurora] [Ekko]   [Lee Sin]
```
- Nhìn một lần là biết ai được lợi nhất, ai thiệt nhất. **Rất dễ gây tranh luận** ("sao Ambessa nerf nặng nhất?!"), tốt cho tương tác.
- Cần bạn chấm **mức độ** cho từng tướng. Nên dùng làm **ảnh tổng kết** cuối bộ, hoặc thay phương án A khi đã quen.

## 5. Ảnh CHI TIẾT (mỗi tướng 1 ảnh)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [LOGO]  │ 7.2b │                                                     3 / 12  @tenkenh   │
│ ┌────────────────────────────────┐                                                     │
│ │                                │   LEE SIN                               ┌──────────┐│
│ │                                │   Thầy Tu Mù · ĐẤU SĨ / SÁT THỦ          │ ▲▲ BUFF  ││
│ │    SPLASH ART (skin mặc định)  │                                         └──────────┘│
│ │    gradient mờ dần vào nền     │  ┌─────────────────────────────────────────────────┐│
│ │    màu primary của tướng       │  │ [icon]  CHIÊU 2 · Hộ Thể / Kiên Định            ││
│ │                                │  │         CẤP 1   CẤP 2   CẤP 3   CẤP 4           ││
│ │                                │  │ Lá chắn   80     140     200     260   (cũ)     ││
│ │                                │  │          100     160     220     280   ▲ +20    ││
│ │                                │  │ Hút máu   16%    24%     32%     40%   (cũ)     ││
│ │                                │  │           20%    30%     40%     50%   ▲ +4~10  ││
│ │                                │  └─────────────────────────────────────────────────┘│
│ └────────────────────────────────┘                                                     │
│ ┌──────────────────────────────────────────────────────────────────────────────────────┐│
│ │ 💬  Lee Sin rừng lì đòn hơn hẳn — combo W vào giao tranh sớm giờ gần như "miễn phí".  ││
│ └──────────────────────────────────────────────────────────────────────────────────────┘│
│ Hình ảnh © Riot Games                                                                   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Các thành phần

| Vùng | Nội dung | Nguồn dữ liệu |
|---|---|---|
| Trái (~40%) | Splash art 1280×720, cắt lấy phần nhân vật, gradient mờ dần sang phải | Trang tướng → skin đầu tiên |
| Tiêu đề | Tên tướng (Oswald ~96px) + danh hiệu + vai trò | Trang tướng → `characterMasthead` |
| Nhãn trạng thái | `▲▲ BUFF` / `▼ NERF` / `⇄ ĐIỀU CHỈNH` | **Bạn chọn** (công cụ gợi ý trước) |
| Thẻ thay đổi | Icon skill 96–112px, ô chiêu (NỘI TẠI / CHIÊU 1 / 2 / 3 / CHIÊU CUỐI), tên skill, các dòng số liệu | Patch notes + trang tướng |
| Câu chốt | 1 câu ≤ 20 từ, chữ ~44px, nền mờ nổi bật | **Bạn viết** (gợi ý từ lý do của Riot) |
| Chân | Số trang `3 / 12`, handle, ghi chú bản quyền | Tự động |

### Cách hiển thị số liệu

| Trường hợp | Cách hiện | Ví dụ |
|---|---|---|
| 1 giá trị | `cũ → mới` + ô chênh lệch (số tuyệt đối + %) | `46 → 37` · **▼ −9 (−20%)** |
| Theo cấp, chênh đều | Bảng cấp + ô `+X mỗi cấp` | Lá chắn: **▲ +20 mỗi cấp** |
| Theo cấp, chênh lệch không đều | Bảng cấp, **tô màu từng ô** | Kayle: ô cấp 1–2 xanh, cấp 3 xám, cấp 4 đỏ |
| Có hệ số (SMPT, SMCK) | Tách **cơ bản** và **hệ số** thành 2 dòng | `+5 mỗi cấp` và `Hệ số SMPT 30% → 33%` |
| Chỉ số vốn đã là % | Ghi chênh lệch bằng **điểm %**, không ghi % của % | `15% → 10%` = **▼ −5 điểm %** (không ghi −33%) |
| Chỉ số ngược | Tự đảo màu | `Hồi chiêu 80/70/60 → 80/75/70 giây` = **▼ NERF** dù số tăng |
| Chỉ số cơ bản | Icon riêng (tự thiết kế) thay cho icon skill | Jayce: Giáp cơ bản |

- Số cũ màu xám nhạt, **có thể gạch ngang**. Số mới to, có màu. Mắt người xem đi thẳng vào số mới.
- Có thể thêm **thanh so sánh** (2 thanh ngang cũ/mới) cho các thay đổi 1 giá trị. Trực quan hơn số trần.

### Chống tràn nội dung

- Tối đa **3 thẻ skill hoặc 8 dòng số liệu** mỗi ảnh.
- Nhiều hơn thì chuyển sang **chế độ gọn**: chữ nhỏ hơn, bỏ bảng cấp, chỉ hiện "cũ → mới".
- Vẫn không vừa thì **tách thành 2 ảnh**: "Lee Sin (1/2)", "Lee Sin (2/2)".
- Tên skill dài → JS tự giảm cỡ chữ cho vừa (auto-fit), không để chữ xuống dòng xấu.

### Ảnh chi tiết TRANG BỊ

Dùng lại khung của ảnh tướng:
- Bên trái: icon trang bị phóng to trên nền hiệu ứng, thay cho splash.
- Tiêu đề: tên trang bị + **giá vàng**.
- Thẻ thay đổi: "Chỉ số cơ bản" và "Nội tại: Vọng Âm…".
- Nếu mỗi trang bị chỉ đổi 1–2 dòng → **gộp 2–4 trang bị vào 1 ảnh** (lưới 2×2) cho gọn.

## 6. Các ảnh phụ (đề xuất)

### Ảnh bìa (luôn là ảnh đầu tiên)
```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│             [cắt ghép splash của 3 tướng nổi bật nhất, chéo nhau, màu mạnh]            │
│                                                                                        │
│     CẬP NHẬT 7.2b                                                                      │
│     LEE SIN LÊN ĐỈNH,                         ▲ 3 BUFF   ▼ 6 NERF   ⇄ 1 ĐIỀU CHỈNH    │
│     AMBESSA "CHẾT" ?                                                                   │
│                                                          [LOGO] @tenkenh               │
└────────────────────────────────────────────────────────────────────────────────────────┘
```
- Tiêu đề ≤ 8 từ, có yếu tố gây tò mò/tranh luận. Trên TikTok, đây chính là thumbnail.

### Ảnh tổng kết "Thắng lớn / Thua đau" (ảnh cuối)
- 2 cột: 3 tướng hưởng lợi nhất và 3 tướng chịu thiệt nhất, hoặc dùng "thang đo" ở phương án B.
- Dòng kêu gọi: *"Main của bạn nằm bên nào? Bình luận nhé 👇"* + *"Theo dõi để nhận patch sớm nhất"*.

<a id="bien-the-9-16"></a>

## 7. Biến thể 9:16 cho TikTok

Canvas **1080 × 1920**, dùng lại đúng dữ liệu, chỉ khác CSS:

```
┌──────────────────────────┐
│ [LOGO]           │7.2b│  │
│                          │
│   LEE SIN                │  ← tên tướng rất to (~120px)
│   ▲▲ BUFF                │
│ ┌──────────────────────┐ │
│ │ splash (cắt dọc,     │ │
│ │ lấy phần nhân vật)   │ │
│ └──────────────────────┘ │
│ ┌──────────────────────┐ │
│ │[icon] CHIÊU 2        │ │
│ │ Lá chắn 80 → 100 ... │ │  ← thẻ số liệu xếp dọc
│ │ Hút máu 16% → 20% ...│ │
│ └──────────────────────┘ │
│ 💬 Câu chốt thật to      │
│                          │
│  (chừa ~250px dưới cho   │  ← vùng chữ caption + nút của TikTok
│   caption/nút TikTok)    │
└──────────────────────────┘
```
- **Vùng an toàn TikTok:** chừa khoảng 250px ở đáy (caption, nhạc) và khoảng 150px ở cạnh phải (nút tim, bình luận, chia sẻ).
- Splash 1280×720 là ảnh ngang → cắt lấy phần nhân vật bằng `object-position` (chỉnh riêng từng tướng nếu cần, lưu trong `overrides.json`).

## 8. Checklist trước khi chốt thiết kế

- [ ] Xem thử trên **điện thoại thật** (gửi ảnh qua Messenger/Zalo cho mình rồi mở ra xem), không chỉ xem trên màn hình máy tính
- [ ] Chụp màn hình ảnh rồi chuyển sang đen trắng: vẫn phân biệt được BUFF và NERF không?
- [ ] Tên tướng dài nhất ("NUNU & WILLUMP", "AURELION SOL") không bị tràn
- [ ] Skill có tên dài nhất, tướng có nhiều thay đổi nhất: không vỡ bố cục
- [ ] Chữ có dấu chồng (Ệ, Ỗ…) không bị cắt
- [ ] Patch có 1 tướng và patch có 25 tướng: ảnh tổng quan vẫn đẹp
