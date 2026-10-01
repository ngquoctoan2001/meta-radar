---
name: them-tuong-trang-bi
description: Thêm hoặc làm mới dữ liệu + hình ảnh cho tướng / trang bị Liên Minh Tốc Chiến trong dự án meta-wildrift — tải splash và icon kỹ năng nét nhất (trang vi-vn + máy chủ Tốc Chiến Trung Quốc), đo vị trí khuôn mặt để căn khung (focusX), tải icon / giá / chỉ số / tên tiếng Việt của trang bị, chọn tags và màu nhấn. Dùng khi patch có tướng hoặc trang bị chưa có trong data/, khi audit báo "chưa có data/…", hoặc khi người dùng nói "thêm tướng X", "tải ảnh trang bị Y", "ảnh tướng bị lệch / che mặt", "icon trang bị sai", "tải lại ảnh cho nét hơn".
---

# Thêm / làm mới tướng và trang bị

Dữ liệu dùng chung cho mọi patch: `data/champions/<slug>.json`, `data/items/<slug>.json`, ảnh trong `assets/`. Tải một lần, patch sau dùng lại. Chỉ tải thứ patch đang cần (người dùng muốn vậy — không tải cả 140 tướng).

## Tướng

### 1. Tải dữ liệu + ảnh
```bash
node scripts/fetch-champion.mjs <slug> [slug...]
```
- Slug theo trang vi-vn: chữ thường, bỏ `'` và `.`, khoảng trắng → `-`, `&` → `and` (`lee-sin`, `kaisa`, `dr-mundo`, `nunu-and-willump`; Ngộ Không → `wukong`). Sai slug → script báo "Không có tướng…".
- Script tự chọn bản nét hơn giữa trang vi-vn và máy chủ CN cho splash và từng icon, in ra kích thước đã chọn. Chạy lại được bất cứ lúc nào (vd để lấy icon nét hơn); phần `layout` chỉnh tay được giữ nguyên.
- Tướng mới chưa có trên trang vi-vn → báo người dùng, đừng tự chế dữ liệu.

### 2. Đo vị trí khuôn mặt (`layout.focusX`)
Ảnh chi tiết đặt khuôn mặt tướng vào cùng một chỗ trên mọi ảnh nhờ `focusX` = vị trí ngang của khuôn mặt trong splash (0 = mép trái, 1 = mép phải). Tướng mới có `focusX: 0.5` mặc định — gần như luôn sai.
```bash
node scripts/splash-grid.mjs <slug> [slug...]
```
Mở `review/splash-<slug>.png` bằng Read: vạch vàng đánh số 0.1…0.9, vạch hồng là `focusX` hiện tại. Đọc tâm khuôn mặt (giữa hai mắt), rồi ghi:
```bash
node scripts/splash-grid.mjs <slug> --focus=0.62
```
Lệnh ghi `layout.focusX` vào `data/champions/<slug>.json` và vẽ lại lưới — mở lại ảnh xem vạch hồng đã nằm giữa mặt chưa. Có thể kiểm tra thêm bằng ảnh chi tiết của tướng (`node scripts/render.mjs <patch> <slug>`). Tướng đứng sát mép phải ảnh gốc (vd Caitlyn ~0.78) thì khung dừng ở mép — mặt lệch phải chút là bình thường.

**Thẻ tướng của tier list** cắt ảnh quanh tâm khuôn mặt `layout.face` (x và y) thay vì `focusX`. Ảnh lưới có cả vạch ngang; đọc tâm khuôn mặt rồi ghi:
```bash
node scripts/splash-grid.mjs ashe --face=0.575,0.27
```
Dấu thập xanh trên ảnh lưới là vị trí đã ghi. `focusX` và `face` độc lập nhau — đừng chép số này sang số kia (focusX đã tính cả cách ảnh patch cắt khung).

Script in kích thước icon đã chọn: máy chủ CN không có icon (404) thì dùng icon 96px của trang vi-vn — bình thường, không cần xử lý.

## Trang bị

### 1. Tải dữ liệu + icon
```bash
node scripts/fetch-item.mjs "Yun Tal Wildarrows" "Vũ Điệu Tử Thần"
```
- Nhận tên tiếng Anh **hoặc** tiếng Việt (tên chính thức của Riot). Script tìm đúng món trên dữ liệu Tốc Chiến CN (icon 128px, giá và chỉ số bản Tốc Chiến — khác bản PC), tên tiếng Việt, tên nội tại.
- In ra dòng `✔ … CN <tên Trung> #<mã> · <giá> · <chỉ số>` — đối chiếu nhanh với bản dịch (giá/chỉ số "trước" trong .md nên khớp).
- Không tìm được (thường là **trang bị chỉ có ở Tốc Chiến**, không có trên PC):
  ```bash
  node scripts/fetch-item.mjs --list=3100          # lọc danh sách CN theo giá / chữ
  node scripts/fetch-item.mjs "Tên EN" --cn=<mã> --slug=<slug>
  ```
  Chọn món dựa trên giá + chỉ số trong bản dịch (tên tiếng Trung bạn tự dịch được). Món không có tên VN chính thức → hỏi người dùng hoặc để trống `nameVi`.

### 2. `tags` và `color`
Xem icon (`assets/items/<slug>.png`) rồi chạy lại kèm cờ (chạy lại an toàn, chỉ ghi đè dữ liệu tải về):
```bash
node scripts/fetch-item.mjs "Infinity Edge" --tags="Xạ thủ,Chí mạng" --color=#FFC940
```
- `tags`: 2–3 nhãn, vai trò trước rồi thuộc tính — Xạ thủ, Pháp sư, Đấu sĩ, Đỡ đòn, Sát thủ, Hỗ trợ · Chí mạng, Tốc đánh, Xuyên giáp, Năng lượng, Hồi máu, Giáp, Kháng phép…
- `color`: màu nhấn `#RRGGBB` hợp màu chủ đạo của icon — dùng cho quầng sáng sau biểu tượng. Ví dụ: Yun Tal vàng cam `#FFB547`, Vòng Thì Thầm xanh `#7FD8FF`, Vũ Điệu Tử Thần đỏ `#FF5A5A`, Vô Cực Kiếm vàng `#FFC940`.
- `stats` do script dịch sẵn; nhãn chỉ số trong patch.json nên trùng nhãn ở đây để ô "Sau cập nhật" tự cập nhật.
- Không truyền cờ thì `tags`/`color` cũ được giữ nguyên.

## Icon hệ thống / phép bổ trợ
- Có sẵn: `assets/icons/smite.png`; vẽ sẵn bằng SVG: `iconSvg: "tower" | "nexus" | "shield"`.
- Phép bổ trợ khác: tải `https://ddragon.leagueoflegends.com/cdn/<phiên bản>/img/spell/Summoner<Tên>.png` (phiên bản mới nhất ở `https://ddragon.leagueoflegends.com/api/versions.json`) vào `assets/icons/<ten>.png`. Mọi nguồn chỉ có bản 64px (CommunityDragon cũng vậy) — hơi mềm khi phóng to, chấp nhận được.

## Đừng làm
- Không lấy ảnh từ ggmeo.com (dữ liệu LMHT PC, trang chứa link cá cược ẩn) hay leagueoflegends.com (PC, sai kỹ năng Tốc Chiến).
- LoL Wiki / Fandom chặn bằng Cloudflare "xác minh bạn là người" — không cố vượt qua.
