# Meta Tốc Chiến — Bộ ảnh cập nhật phiên bản

Dự án tạo bộ ảnh **16:9** tóm tắt mỗi bản cập nhật (patch) và **tier list** của Liên Minh Huyền Thoại: Tốc Chiến để đăng lên **TikTok** và **Facebook**.

Mọi ảnh xuất ra đều **3840×2160** (khung vẽ 1920×1080 chụp ở độ nét gấp đôi — chữ, số, icon vẫn sắc sau khi Facebook nén ảnh).

Ảnh được dựng bằng **HTML + CSS + JS thuần**, rồi chụp thành PNG bằng trình duyệt Edge có sẵn trên máy.

> Trạng thái: patch 7.3a hoàn chỉnh — 17 ảnh: tổng quan, 11 tướng, 4 trang bị, hệ thống & bản đồ.

## Chạy

Nhấp đúp **`start.bat`**. Lần đầu sẽ tự cài đặt, sau đó mở trang quản lý tại `http://localhost:5173`.

Hoặc dùng dòng lệnh:

```bash
npm start
```

Trang quản lý có:
- Cột trái: mục **Bản cập nhật** (các patch) rồi mục **Tier List** (các kỳ tier list).
- Xem trước tất cả ảnh của bộ ảnh, lọc theo Tổng quan / Tướng / Trang bị / Khác (tier list: Tổng quan / Theo đường).
- **Xem lớn**: dùng ← → để chuyển ảnh, Esc để đóng.
- **Tải PNG** từng ảnh, **Tải tất cả (.zip)**, **Mở thư mục ảnh**, xem **bản dịch (.md)** gốc.
- Ảnh xuất ra (3840×2160) được lưu cả vào `patches/<bản>/out/` (tier list: `tierlists/<id>/out/`), tên dạng `7.3a-02-samira.png`.

Xuất ảnh không cần mở trang (server chưa chạy thì script tự bật tạm):

```bash
node scripts/render.mjs 7.3a
```

## Deploy lên web (Cloudflare Pages)

`npm run build` tạo bản web tĩnh trong `dist/`. Bản này **chỉ để xem ảnh**: không có server nên không có nút tải PNG / ZIP (xuất ảnh vẫn chạy trên máy bằng `start.bat`).

Cài đặt trên Cloudflare Pages:

| Ô | Giá trị |
|---|---|
| Framework preset | `None` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | `/` |

Mỗi lần push lên GitHub, Cloudflare tự build lại, nên patch mới sẽ tự xuất hiện trên web.

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

Gửi file `.md` bản dịch patch cho Claude (vd *"bản cập nhật mới nè, file patch-7-3-b.md"*). Skill **tao-anh-patch** sẽ lo trọn quy trình:
1. Đọc `.md` → tạo `patches/<bản>/patch.json` (định dạng: [07-dinh-dang-patch-json.md](docs/07-dinh-dang-patch-json.md)).
2. Tải dữ liệu + ảnh tướng/trang bị còn thiếu, đo vị trí khuôn mặt tướng.
3. Viết câu chốt (bản nháp — bạn sửa được trong `patch.json`).
4. Kiểm tra tự động, xuất ảnh vào `patches/<bản>/out/`, gửi ảnh tổng hợp để duyệt.

Sau đó bấm **Làm mới** trên trang quản lý để xem và tải ảnh.

## Tier List

Tab **Tier List** trên trang quản lý: tướng mạnh nhất từng đường theo bảng xếp hạng Tốc Chiến Trung Quốc (排行榜 · 强度, đã chốt bộ lọc *Đại Cao Thủ trở lên*).
- 1 ảnh tổng quan (top 3 mỗi đường) + 5 ảnh theo đường (Baron · Rừng · Giữa · Rồng · Hỗ trợ), đủ tướng T0 và T1.
- Tướng có trong bản cập nhật gần nhất tự gắn nhãn **BUFF/NERF 7.3a**; có tier list kỳ trước thì tự gắn **MỚI / LÊN T0 / XUỐNG T1**.
- Làm mới: gửi ảnh chụp bảng xếp hạng (đủ T0, T1 của cả 5 đường; ngày lấy ở dòng 刷新时间) cho Claude — skill **tao-tier-list**. Mỗi đường chứa 0–3 tướng T0 và tối đa 7 tướng T1. Dữ liệu ở `tierlists/tier-<ngày>/tierlist.json`, ảnh chụp gốc ở `source/`, ảnh xuất ở `out/`.

## Build cao thủ

Mục **Build** trên trang quản lý: 1 ảnh / tướng gồm 3 build của cao thủ (bảng xếp hạng Tốc Chiến Trung Quốc) — mỗi build 6 trang bị theo thứ tự + ngọc (1 ngọc chính + 4), kèm tình huống dùng (hợp đội hình nào, khắc chế đối thủ nào) — và avatar 3 tướng **mạnh khi gặp**, 3 tướng **yếu khi gặp**, 3 **hỗ trợ hợp**.
- Giải thích trang bị (chỉ số + nội tại theo tooltip trong game) lưu ở trường `summary` của `data/items/<món>.json` để dùng lại; mẫu ảnh `build-items` có sẵn nhưng không đưa vào bộ ảnh.
- Dữ liệu: `builds/build-<tướng>-<ngày>/build.json`, ảnh chụp gốc trong `source/`. Ngọc + phép bổ trợ: `node scripts/fetch-runes.mjs` → `data/runes.json`, `assets/runes/`, `assets/spells/`.

### Skill cho Claude (`.claude/skills/`)

| Skill | Dùng khi |
|---|---|
| `tao-anh-patch` | Gửi file `.md` patch mới → tạo trọn bộ ảnh |
| `tao-tier-list` | Gửi ảnh chụp bảng xếp hạng Tốc Chiến Trung Quốc → bộ ảnh tier list |
| `them-tuong-trang-bi` | Thêm/làm mới tướng hoặc trang bị, ảnh tướng bị lệch, icon sai |
| `kiem-tra-anh-patch` | Sửa câu chốt / trạng thái / số liệu rồi xuất lại, kiểm tra lỗi trước khi đăng |

### Script

| Lệnh | Việc |
|---|---|
| `node scripts/fetch-champion.mjs <slug…>` | Tải dữ liệu + splash + icon kỹ năng (tự chọn bản nét nhất) |
| `node scripts/splash-grid.mjs <slug…>` | Ảnh splash kẻ lưới dọc + ngang → đo `layout.focusX` (ảnh patch) và `--face=x,y` (thẻ tier list) |
| `node scripts/tierlist.mjs new <yyyy-mm-dd> baron=<ảnh> …` · `lane <id> <đường> "<tên> <T0\|T1> <thắng> <chọn> <cấm>; …"` · `compare <id>` | Tạo tier list theo ngày (báo ảnh trùng bộ đã làm, tự chọn bản cập nhật + kỳ trước), ghi số liệu từng đường bằng tên tiếng Trung, so sánh để viết câu chốt |
| `node scripts/fetch-runes.mjs` | Tải 55 ngọc (icon 256px) + phép bổ trợ (128px) của Tốc Chiến, tên Việt đối chiếu Riot → `data/runes.json` |
| `node scripts/cn-hero.mjs <tên tiếng Trung…>` | Tra tên tướng trong ảnh bảng xếp hạng CN ra slug, báo đã có dữ liệu / khuôn mặt chưa |
| `node scripts/fetch-item.mjs "<tên EN/VN>"` | Tải icon, giá, chỉ số Tốc Chiến, tên VN của trang bị · `--list` để tra tay |
| `node scripts/audit.mjs <bản> --sheet` | Kiểm tra dữ liệu + từng ảnh, tạo `review/<bản>-tong-hop.png` (tier list: `tier-<ngày>`) |
| `node scripts/render.mjs <bản>` | Xuất ảnh 3840×2160 (tier list: `tier-<ngày>`) |
| `node scripts/render-brand.mjs [avatar\|cover]` | Xuất avatar 1080×1080 và ảnh bìa Facebook 1640×924 (+ `@2x`) từ `brand/*.html` → `brand/`, kèm logo 512px `assets/brand/meta-radar-logo.png` gắn ở thanh trên mọi ảnh; xem thử khi lên TikTok/Facebook ở `review/avatar-preview.png`, `review/cover-preview.png` |

## Cấu trúc thư mục

```
index.html · slide.html          trang quản lý · khung vẽ 1 ảnh 1920×1080 (?patch=7.3a&slide=samira)
start.bat                        nhấp đúp để chạy
src/css/                         tokens.css (màu, font) · slide-*.css (từng loại ảnh) · gallery.css
src/js/lib/output.js             khung vẽ 1920×1080 · chụp tỉ lệ 2 → ảnh 3840×2160 · tên file ảnh xuất
src/js/slides/                   overview.js · champion.js · item.js · system.js · tier.js (tier list) · build.js (build)
src/js/lib/                      values.js (phân tích số liệu) · ui.js (thành phần chung) · fit.js (tự co chữ)
data/brand.json                  tên kênh, logo kênh, handle TikTok (@meta.radar), bật/tắt logo game
brand/                           avatar.html · cover.html (ảnh bìa Facebook) · radar.js · brand.css · PNG đã xuất
data/champions/<tướng>.json      tải tự động + vị trí khuôn mặt trong splash (layout.focusX)
data/items/<trang-bị>.json       tên EN/VN, giá, chỉ số, màu nhấn
patches/<bản>/                   source.md (bản dịch) · patch.json (dữ liệu ảnh) · out/ (PNG đã xuất)
tierlists/tier-<ngày>/           source/ (ảnh chụp bảng xếp hạng) · tierlist.json · out/
builds/build-<tướng>-<ngày>/     source/ (ảnh build + tooltip trang bị) · build.json · out/
assets/                          logo, ảnh tướng, icon skill/trang bị, font (chạy offline)
scripts/                         server.mjs · render.mjs · audit.mjs · fetch-champion.mjs · fetch-item.mjs · splash-grid.mjs · render-brand.mjs · cn-hero.mjs · tierlist.mjs · fetch-runes.mjs
.claude/skills/                  skill cho Claude: tao-anh-patch · them-tuong-trang-bi · kiem-tra-anh-patch
review/                          ảnh kiểm tra tạm (không commit)
tests/                           kiểm thử bộ phân tích số liệu:  npm test
```

## Nguồn hình ảnh

| Loại | Nguồn |
|---|---|
| Logo, ảnh chân dung, tên skill tiếng Việt | Trang chính thức Tốc Chiến vi-vn (`wildrift.leagueoflegends.com`) |
| Splash, icon skill | Tự chọn bản **nét hơn** giữa trang vi-vn (splash 1280×720, icon 96px) và máy chủ Tốc Chiến Trung Quốc (splash tới 2436×1124, icon 128–650px) |
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
