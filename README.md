# Meta Tốc Chiến — Bộ ảnh cập nhật phiên bản

Dự án tạo bộ ảnh tóm tắt mỗi bản cập nhật (patch) của Liên Minh Huyền Thoại: Tốc Chiến để đăng lên **TikTok** và **Facebook**, với **3 khổ ảnh**:

| Khổ | Ảnh xuất ra | Dùng cho | Bố cục |
|---|---|---|---|
| **16:9** | 1920×1080 | Facebook · YouTube | Bản gốc (đã chốt) |
| **9:16** | 1080×1920 | TikTok · Reels · Story | Xếp dọc: ảnh tướng/biểu tượng ở trên, câu chốt, rồi các thẻ thay đổi |
| **1:1** | 1080×1080 | Facebook · Instagram | Tướng: dải splash + thẻ kỹ năng 2 cột · Trang bị: 2 cột như 16:9 |

Ảnh được dựng bằng **HTML + CSS + JS thuần**, rồi chụp thành PNG bằng trình duyệt Edge có sẵn trên máy.

> Trạng thái: patch 7.3a có 4 ảnh × 3 khổ: tổng quan, Samira, Yun Tal Wildarrows, hệ thống & bản đồ.

## Chạy

Nhấp đúp **`start.bat`**. Lần đầu sẽ tự cài đặt, sau đó mở trang quản lý tại `http://localhost:5173`.

Hoặc dùng dòng lệnh:

```bash
npm start
```

Trang quản lý có:
- Danh mục các bản cập nhật ở cột trái.
- **3 nút chọn khổ: 16:9 · 9:16 · 1:1** — xem trước, xem lớn, tải PNG/ZIP đều theo khổ đang chọn.
- Xem trước tất cả ảnh của patch, lọc theo Tổng quan / Tướng / Trang bị / Khác.
- **Xem lớn**: dùng ← → để chuyển ảnh, Esc để đóng.
- **Tải PNG** từng ảnh, **Tải tất cả (.zip)**, **Mở thư mục ảnh**, xem **bản dịch (.md)** gốc.
- Ảnh xuất ra được lưu cả vào `patches/<bản>/out/<khổ>/`, tên dạng `7.3a-02-samira-9x16.png`.

Xuất ảnh không cần mở trang (server chưa chạy thì script tự bật tạm):

```bash
node scripts/render.mjs 7.3a
```
Lệnh trên xuất cả 3 khổ. Chỉ muốn 1 khổ thì thêm `--format=9x16` (hoặc `16x9`, `1x1`).

## Các loại ảnh (component)

| Loại | `type` | Nội dung |
|---|---|---|
| Tổng quan | `overview` | Mỗi trạng thái (BUFF/NERF/ĐIỀU CHỈNH) một hàng tướng, kèm icon các kỹ năng bị đổi. Hàng cuối là trang bị + hệ thống |
| Tướng | `champion` | Splash + tên + trạng thái + câu chốt bên trái. Bên phải là thẻ từng kỹ năng: icon, tên, `cũ → mới`, chênh lệch |
| Trang bị | `item` | Biểu tượng lớn + tên EN/VN + câu chốt. Thẻ thay đổi, cán cân tăng/giảm, chỉ số sau cập nhật |
| Khác | `system` | Thay đổi hệ thống/bản đồ (Trừng Phạt, Nhà Chính, Giáp Trụ…) |

Màu sắc và BUFF/NERF của **từng dòng số liệu được tính tự động**:
- Hiểu đúng các chỉ số ngược: hồi chiêu, giá, ngưỡng… giảm là BUFF.
- Tô màu từng cấp khi thay đổi lẫn lộn (vd Tristana Q: 50/75/100/125% → 60/80/100/120%).

## Thêm patch mới

1. Bạn gửi file `.md` bản dịch patch.
2. Claude chuyển thành `patches/<bản>/patch.json`. Định dạng xem ở [07-dinh-dang-patch-json.md](docs/07-dinh-dang-patch-json.md).
3. Tướng nào chưa có ảnh thì tải về:
   ```bash
   node scripts/fetch-champion.mjs <tên-tướng>
   ```
4. Bấm **Làm mới** trên trang quản lý, duyệt, rồi tải ảnh.

## Cấu trúc thư mục

```
index.html · slide.html          trang quản lý · khung vẽ 1 ảnh (?patch=7.3a&slide=samira&format=9x16)
start.bat                        nhấp đúp để chạy
src/css/                         tokens.css (màu, font) · slide-*.css (từng loại ảnh, khổ 16:9)
                                 slide-9x16.css · slide-1x1.css (chỉ ghi đè bố cục cho khổ dọc/vuông) · gallery.css
src/js/lib/formats.js            định nghĩa 3 khổ ảnh (kích thước khung vẽ, kích thước xuất)
src/js/slides/                   overview.js · champion.js · item.js · system.js
src/js/lib/                      values.js (phân tích số liệu) · ui.js (thành phần chung) · fit.js (tự co chữ)
data/brand.json                  tên kênh, handle, bật/tắt logo game
data/champions/<tướng>.json      tải tự động từ trang Tốc Chiến + vị trí cắt splash (layout)
data/items/<trang-bị>.json       tên EN/VN, giá, chỉ số, màu nhấn
patches/<bản>/                   source.md (bản dịch) · patch.json (dữ liệu ảnh) · out/<khổ>/ (PNG đã xuất)
assets/                          logo, ảnh tướng, icon skill/trang bị, font (chạy offline)
scripts/                         server.mjs · render.mjs · fetch-champion.mjs
tests/                           kiểm thử bộ phân tích số liệu:  npm test
```

## Nguồn hình ảnh

| Loại | Nguồn |
|---|---|
| Logo, ảnh tướng, splash, icon + tên skill | Trang chính thức Tốc Chiến vi-vn (`wildrift.leagueoflegends.com`) |
| Icon trang bị (bản Tốc Chiến 128px) + chỉ số gốc | Dữ liệu Tốc Chiến máy chủ Trung Quốc (`game.gtimg.cn`) |
| Tên tiếng Việt của trang bị | Riot Data Dragon `vi_VN` |
| Icon Trừng Phạt | Riot Data Dragon |
| Font | Saira Extra Condensed · Chakra Petch · Be Vietnam Pro (Google Fonts, tải về máy) |

## Tài liệu phân tích (brainstorm)

| # | File | Nội dung |
|---|------|----------|
| 1 | [01-phan-tich-y-tuong.md](docs/01-phan-tich-y-tuong.md) | Người xem, nền tảng TikTok/Facebook, điểm khác biệt, rủi ro |
| 2 | [02-nguon-du-lieu-va-anh.md](docs/02-nguon-du-lieu-va-anh.md) | Nguồn ảnh và dữ liệu, chính sách fan content của Riot |
| 3 | [03-thiet-ke-hinh-anh.md](docs/03-thiet-ke-hinh-anh.md) | Bố cục, màu buff/nerf, chữ, wireframe |
| 4 | [04-kien-truc-ky-thuat.md](docs/04-kien-truc-ky-thuat.md) | Kiến trúc kỹ thuật |
| 5 | [05-quy-trinh-va-noi-dung.md](docs/05-quy-trinh-va-noi-dung.md) | Quy trình mỗi patch, caption, hashtag, series |
| 6 | [06-lo-trinh-va-cau-hoi.md](docs/06-lo-trinh-va-cau-hoi.md) | Lộ trình + câu hỏi cần chốt |
| 7 | [07-dinh-dang-patch-json.md](docs/07-dinh-dang-patch-json.md) | Định dạng dữ liệu `patch.json` |
# meta-radar
