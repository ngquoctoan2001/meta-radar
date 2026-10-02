# Meta Tốc Chiến — Bộ ảnh cập nhật phiên bản

Dự án tạo bộ ảnh tóm tắt mỗi bản cập nhật (patch), **tier list** và **build cao thủ** của Liên Minh Huyền Thoại: Tốc Chiến để đăng lên **TikTok** và **Facebook**.

Khổ ảnh (khung vẽ chụp ở độ nét gấp đôi — chữ, số, icon vẫn sắc sau khi Facebook nén ảnh):

| Bộ ảnh | Khổ | Ảnh xuất |
|---|---|---|
| Bản cập nhật, tier list | 16:9 | 3840×2160 |
| Build (ảnh tổng quan + ảnh từng tướng) | vuông 1:1 | 2160×2160 |
| Thumbnail clip TikTok của bộ build | dọc 3:4 | 2160×2880 |

Ảnh được dựng bằng **HTML + CSS + JS thuần**, rồi chụp thành PNG bằng trình duyệt Edge có sẵn trên máy.

> Trạng thái: patch 7.3a hoàn chỉnh — 17 ảnh: tổng quan, 11 tướng, 4 trang bị, hệ thống & bản đồ.

## Chạy

Nhấp đúp **`start.bat`**. Lần đầu sẽ tự cài đặt, sau đó mở trang quản lý tại `http://localhost:5173`.

Hoặc dùng dòng lệnh:

```bash
npm start
```

Trang quản lý có:
- Cột trái: mục **Bản cập nhật** (các patch), **Tier List** (các kỳ tier list) rồi **Build** (các bộ build).
- Xem trước tất cả ảnh của bộ ảnh, lọc theo Tổng quan / Tướng / Trang bị / Khác (tier list: Tổng quan / Theo đường; build: Tổng quan / Tướng / Thumbnail).
- **Xem lớn**: dùng ← → để chuyển ảnh, Esc để đóng.
- **Mở thư mục ảnh** (thư mục `out/` chứa ảnh PNG đã xuất), xem **bản dịch (.md)** gốc.
- Trang quản lý chỉ để xem: không có nút tải PNG / ZIP / mở tab mới (đã bỏ — ảnh PNG nằm sẵn trong thư mục `out/`).

Ảnh PNG xuất bằng lệnh (Claude chạy sau khi tạo / sửa bộ ảnh; server chưa chạy thì script tự bật tạm), lưu vào `patches/<bản>/out/` (tier list: `tierlists/<id>/out/`, build: `builds/<id>/out/`), tên dạng `7.3a-02-samira.png`:

```bash
node scripts/render.mjs 7.3a
```

## Deploy lên web (Cloudflare Pages)

`npm run build` tạo bản web tĩnh trong `dist/`. Bản này **chỉ để xem ảnh**: không có server nên không có nút mở thư mục ảnh (xuất ảnh vẫn chạy trên máy bằng `node scripts/render.mjs`).

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

Sau đó bấm **Làm mới** trên trang quản lý để xem ảnh; ảnh PNG nằm trong thư mục `out/` (nút **Mở thư mục ảnh**).

## Tier List

Tab **Tier List** trên trang quản lý: tướng mạnh nhất từng đường theo bảng xếp hạng Tốc Chiến Trung Quốc (排行榜 · 强度, đã chốt bộ lọc *Đại Cao Thủ trở lên*).
- 1 ảnh tổng quan (top 3 mỗi đường) + 5 ảnh theo đường (Baron · Rừng · Giữa · Rồng · Hỗ trợ), đủ tướng T0 và T1.
- Tướng có trong bản cập nhật gần nhất tự gắn nhãn **BUFF/NERF 7.3a**; có tier list kỳ trước thì tự gắn **MỚI / LÊN T0 / XUỐNG T1**.
- Làm mới: gửi ảnh chụp bảng xếp hạng (đủ T0, T1 của cả 5 đường; ngày lấy ở dòng 刷新时间) cho Claude — skill **tao-tier-list**. Mỗi đường chứa 0–3 tướng T0 và tối đa 7 tướng T1. Dữ liệu ở `tierlists/tier-<ngày>/tierlist.json`, ảnh chụp gốc ở `source/`, ảnh xuất ở `out/`.

## Build cao thủ

Mục **Build** trên trang quản lý: 1 ảnh / tướng gồm 3 build của cao thủ (bảng xếp hạng Tốc Chiến Trung Quốc) — mỗi build 6 trang bị theo thứ tự + ngọc (1 ngọc chính + 4), kèm tình huống dùng (hợp đội hình nào, khắc chế đối thủ nào) — và avatar 3 tướng **mạnh khi gặp**, 3 tướng **yếu khi gặp**, 3 tướng **hợp**. Đầu bộ có ảnh tổng quan (6 tướng / ảnh), cuối bộ có thể thêm ảnh thumbnail dọc 3:4.
- **Chỉ có khổ vuông 1:1 (2160×2160)** — bố cục dựng riêng cho khung vuông, hợp bài đăng TikTok / Facebook. Bản 16:9 của ảnh build đã bỏ hẳn (02/10/2026). Mẫu ở `src/js/slides/build.js` + `src/css/slide-build.css`.
- Giải thích trang bị (chỉ số + nội tại theo tooltip trong game) lưu ở trường `summary` của `data/items/<món>.json` để dùng lại; chưa có mẫu ảnh.
- Làm mới: gửi Claude 1–3 ảnh build của cao thủ (popup "<tướng> 主模式" trong bảng xếp hạng) — skill **tao-build**. Mỗi **ngày + vai trò** là 1 bộ (vd `builds/build-2026-10-01-adc/` → mục "01/10 · Build ADC" chứa 6 xạ thủ), ảnh chụp gốc trong `source/<tướng>/`. Ngọc + phép bổ trợ: `node scripts/fetch-runes.mjs` → `data/runes.json`, `assets/runes/`, `assets/spells/`.

### Skill cho Claude (`.claude/skills/`)

| Skill | Dùng khi |
|---|---|
| `tao-anh-patch` | Gửi file `.md` patch mới → tạo trọn bộ ảnh |
| `tao-tier-list` | Gửi ảnh chụp bảng xếp hạng Tốc Chiến Trung Quốc → bộ ảnh tier list |
| `tao-build` | Gửi ảnh build của cao thủ (popup 主模式) → ảnh build 3 cách lên đồ + 9 tướng đối đầu |
| `them-tuong-trang-bi` | Thêm/làm mới tướng hoặc trang bị, ảnh tướng bị lệch, icon sai |
| `kiem-tra-anh-patch` | Sửa câu chốt / trạng thái / số liệu rồi xuất lại, kiểm tra lỗi trước khi đăng |

### Script

| Lệnh | Việc |
|---|---|
| `node scripts/fetch-champion.mjs <slug…>` | Tải dữ liệu + splash + icon kỹ năng (tự chọn bản nét nhất) |
| `node scripts/splash-grid.mjs <slug…>` | Ảnh splash kẻ lưới dọc + ngang → đo `layout.focusX` (ảnh patch), `--face=x,y` (thẻ tier list, ảnh build) và `--avatar=x,y,zoom` (khung avatar riêng trong ảnh build) |
| `node scripts/tierlist.mjs new <yyyy-mm-dd> baron=<ảnh> …` · `lane <id> <đường> "<tên> <T0\|T1> <thắng> <chọn> <cấm>; …"` · `compare <id>` | Tạo tier list theo ngày (báo ảnh trùng bộ đã làm, tự chọn bản cập nhật + kỳ trước), ghi số liệu từng đường bằng tên tiếng Trung, so sánh để viết câu chốt |
| `node scripts/champ-build.mjs read <ảnh…>` · `new <tướng> <yyyy-mm-dd> top1=<ảnh>… [--role=adc]` | Tự nhận trang bị / ngọc / phép bổ trợ trong ảnh build (so icon chính thức, ảnh soát `review/build-read*.png`) → thêm tướng vào bộ `builds/build-<ngày>-<vai trò>/build.json`, tự tải tướng / trang bị thiếu, giày luôn ở ô 6 |
| `node scripts/fetch-runes.mjs` | Tải 55 ngọc (icon 256px) + phép bổ trợ (128px) của Tốc Chiến, tên Việt đối chiếu Riot → `data/runes.json` |
| `node scripts/cn-hero.mjs <tên tiếng Trung…>` | Tra tên tướng trong ảnh bảng xếp hạng CN ra slug, báo đã có dữ liệu / khuôn mặt chưa |
| `node scripts/fetch-item.mjs "<tên EN/VN>"` | Tải icon, giá, chỉ số Tốc Chiến, tên VN của trang bị · `--list` để tra tay |
| `node scripts/audit.mjs <bản> --sheet` | Kiểm tra dữ liệu + từng ảnh, tạo `review/<bản>-tong-hop.png` (tier list: `tier-<ngày>`) |
| `node scripts/render.mjs <bản> [ảnh…]` | Xuất ảnh PNG vào `out/` của bộ ảnh (tier list: `tier-<ngày>`, build: `build-<ngày>-<vai trò>`). Bản cập nhật / tier list 3840×2160, ảnh build vuông 2160×2160, thumbnail 2160×2880 |
| `node scripts/render-brand.mjs [avatar\|cover]` | Xuất avatar 1080×1080 và ảnh bìa Facebook 1640×924 (+ `@2x`) từ `brand/*.html` → `brand/`, kèm logo 512px `assets/brand/meta-radar-logo.png` gắn ở thanh trên mọi ảnh; xem thử khi lên TikTok/Facebook ở `review/avatar-preview.png`, `review/cover-preview.png` |

## Cấu trúc thư mục

```
index.html · slide.html          trang quản lý · khung vẽ 1 ảnh (?patch=7.3a&slide=samira)
start.bat                        nhấp đúp để chạy
src/css/                         tokens.css (màu, font) · slide-*.css (từng loại ảnh) · gallery.css
src/js/lib/output.js             khung vẽ theo loại ảnh (16:9 1920×1080 · build vuông 1080×1080 · bìa dọc 1080×1440), chụp tỉ lệ 2 · tên file ảnh xuất
src/js/slides/                   overview.js · champion.js · item.js · system.js · tier.js (tier list) · build.js (build)
src/js/lib/                      values.js (phân tích số liệu) · ui.js (thành phần chung) · fit.js (tự co chữ)
data/brand.json                  tên kênh, logo kênh, handle TikTok (@meta.radar), bật/tắt logo game
brand/                           avatar.html · cover.html (ảnh bìa Facebook) · radar.js · brand.css · PNG đã xuất
data/champions/<tướng>.json      tải tự động + vị trí khuôn mặt trong splash (layout.focusX)
data/items/<trang-bị>.json       tên EN/VN, giá, chỉ số, màu nhấn
patches/<bản>/                   source.md (bản dịch) · patch.json (dữ liệu ảnh) · out/ (PNG đã xuất)
tierlists/tier-<ngày>/           source/ (ảnh chụp bảng xếp hạng) · tierlist.json · out/
builds/build-<ngày>-<vai trò>/   source/<tướng>/ (ảnh build + tooltip) · build.json (nhiều tướng) · out/
assets/                          logo, ảnh tướng, icon skill/trang bị, font (chạy offline)
scripts/                         server.mjs · render.mjs · audit.mjs · fetch-champion.mjs · fetch-item.mjs · splash-grid.mjs · render-brand.mjs · cn-hero.mjs · tierlist.mjs · fetch-runes.mjs · champ-build.mjs
.claude/skills/                  skill cho Claude: tao-anh-patch · tao-tier-list · tao-build · them-tuong-trang-bi · kiem-tra-anh-patch
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
