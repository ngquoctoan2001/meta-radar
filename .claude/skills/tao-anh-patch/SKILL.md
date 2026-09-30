---
name: tao-anh-patch
description: Tạo trọn bộ ảnh 16:9 cho một bản cập nhật (patch) Liên Minh Tốc Chiến / Wild Rift từ file .md bản dịch patch notes mà người dùng gửi — đọc .md, tạo patches/<bản>/patch.json, tải dữ liệu + ảnh tướng/trang bị còn thiếu, viết câu chốt, kiểm tra và xuất PNG. Dùng skill này bất cứ khi nào người dùng gửi hoặc nhắc tới file patch .md (vd patch-7-3-b.md), dán nội dung patch notes Tốc Chiến, hoặc nói kiểu "có patch mới rồi", "làm ảnh bản 7.4", "tạo bộ ảnh cho bản cập nhật này", "đọc file md rồi tạo ảnh" — kể cả khi không nói rõ chữ "ảnh" hay "skill".
---

# Tạo bộ ảnh cho một patch Tốc Chiến

Dự án `meta-wildrift` dựng ảnh bằng HTML/CSS/JS rồi chụp bằng Edge. **Bạn không cần viết giao diện** — mọi mẫu ảnh đã có và đã được người dùng duyệt. Việc của bạn là **biến file .md thành dữ liệu đúng**, viết câu chốt hay, rồi kiểm tra và xuất ảnh.

Tài liệu gốc trong repo (đọc khi cần):
- `docs/07-dinh-dang-patch-json.md` — định dạng `patch.json` đầy đủ.
- `patches/7.3a/source.md` + `patches/7.3a/patch.json` — **ví dụ mẫu hoàn chỉnh** (md người dùng dịch → json đã duyệt). Mở cả hai ra so khi phân vân.
- `references/chuyen-md-sang-json.md` (trong skill này) — quy tắc chuyển từng dạng nội dung trong .md.
- `references/viet-cau-chot.md` (trong skill này) — cách viết câu chốt, dòng tiêu đề.

## Quy trình

Làm lần lượt; mỗi bước có lý do riêng, đừng bỏ qua bước kiểm tra.

### 1. Chuẩn bị
- `git status` + `git log -3`: repo có thể đang được một phiên Claude khác sửa (deploy Cloudflare). Nếu có thay đổi lạ chưa commit, giữ nguyên, đừng ghi đè.
- Không cần bật server: các script tự bật tạm khi cần. Nếu thấy cảnh báo "Server ở cổng 5173 đang chạy code cũ", script đã tự dùng server riêng — chỉ cần nhắc người dùng tắt cửa sổ `start.bat` rồi mở lại.
- **Sửa file JSON bằng công cụ Edit/Write**, không dùng `sed -i` hay đoạn script ghi đè file: hệ thống quyền có thể chặn các lệnh shell sửa hàng loạt file dữ liệu. `focusX`, `tags`, `color` thì đã có cờ script riêng (bước 3).

### 2. Đọc .md và xác định bản
- Mã bản (`id`) lấy từ tên file hoặc tiêu đề: `patch-7-3-b.md` → `7.3b`, "Bản 7.4" → `7.4`. Không chắc thì hỏi người dùng.
- Nếu `patches/<id>/` đã có: đây là **cập nhật** patch cũ — đọc `patch.json` hiện tại, giữ câu chốt/chỉnh sửa người dùng đã làm, chỉ thêm/sửa phần mới.
- Tạo `patches/<id>/`, chép file .md vào `patches/<id>/source.md` (giữ nguyên file gốc của người dùng).

### 3. Lập danh sách và chuẩn bị dữ liệu còn thiếu
Liệt kê: tướng (kèm trạng thái), trang bị, thay đổi hệ thống/bản đồ.

- **Tướng**: slug theo trang vi-vn — chữ thường, bỏ dấu `'` và `.`, khoảng trắng → `-`, `&` → `and` (Lee Sin → `lee-sin`, Kai'Sa → `kaisa`, Dr. Mundo → `dr-mundo`, Ngộ Không → `wukong`). Chưa có `data/champions/<slug>.json` → skill **them-tuong-trang-bi**, tóm tắt:
  ```bash
  node scripts/fetch-champion.mjs jinx ahri
  node scripts/splash-grid.mjs jinx ahri          # mở review/splash-<slug>.png, đọc vị trí khuôn mặt
  node scripts/splash-grid.mjs jinx --focus=0.62  # ghi focusX (mỗi tướng một lệnh)
  ```
  Bỏ bước đo khuôn mặt thì ảnh chi tiết gần như chắc chắn bị che mặt tướng (mặc định 0.5).
- **Trang bị**: chưa có `data/items/<slug>.json` → skill **them-tuong-trang-bi**, tóm tắt:
  ```bash
  node scripts/fetch-item.mjs "Infinity Edge" --tags="Xạ thủ,Chí mạng" --color=#FFC940
  ```
- **Hệ thống**: Trừng Phạt dùng `assets/icons/smite.png`; công trình/Nhà Chính dùng `iconSvg` (`tower`, `nexus`, `shield`). Phép bổ trợ khác: tải icon từ Data Dragon (`https://ddragon.leagueoflegends.com/cdn/<bản>/img/spell/SummonerFlash.png`) vào `assets/icons/` (mọi nguồn chỉ có 64px — chấp nhận hơi mềm).

### 4. Viết `patches/<id>/patch.json`
Theo `references/chuyen-md-sang-json.md`. Những điều hay sai nhất:
- Mỗi dòng số liệu là `{ "label", "old", "new" }` — **một chỉ số một dòng**. Giá trị gộp kiểu `50/90/130/170 + 75% AP` phải tách thành dòng "Sát thương cơ bản" và dòng "Tỷ lệ AP", bỏ phần không đổi.
- Giữ nguyên số như bản dịch (`5,5`, `3.200`, `20 giây`) — bộ phân tích tự hiểu kiểu số Việt Nam, tự tô màu, tự biết hồi chiêu/giá/ngưỡng giảm là buff.
- Chỉ ghi `"effect"` khi hướng buff/nerf không suy ra được từ con số (vd Nhà Chính giảm máu = trung tính, "thời gian tồn tại" của giáp trụ giảm = yếu đi).
- `reason`: câu giải thích của bản dịch (bỏ phần nguồn như "Wild Rift Fire"). Không in lên ảnh, dùng để viết câu chốt.
- **Không bịa số**: con số nào không có trong .md thì không đưa vào. Chỗ nào .md mơ hồ → ghi lại để báo người dùng ở bước 7.

### 5. Câu chốt + tiêu đề
Theo `references/viet-cau-chot.md`: mỗi tướng/trang bị một câu **≤ 100 ký tự** (2–3 dòng trên ảnh), `headline` 3 cụm ngắn nối bằng ` · `, `systemsVerdict` nếu có thay đổi hệ thống. Đây là phần tạo giá trị riêng cho kênh — viết cẩn thận, bám số liệu thật.

### 6. Thứ tự ảnh (`slides`)
`overview` → tướng BUFF (theo thứ tự trong .md) → tướng NERF → tướng ĐIỀU CHỈNH/LÀM LẠI → trang bị → `systems` (nếu có). Mỗi tướng/trang bị một ảnh.

### 7. Kiểm tra, xuất ảnh, báo cáo
```bash
node scripts/audit.mjs <id> --sheet
```
- Có dòng `✘` → sửa rồi chạy lại cho tới khi sạch. Cách sửa từng lỗi: skill **kiem-tra-anh-patch**.
- Dòng `⚠` → đọc từng cái, sửa nếu hợp lý (vd câu chốt quá dài).
- **Mở `review/<id>-tong-hop.png` bằng Read để tự nhìn cả bộ** — audit không bắt được mọi thứ (vd splash che mặt tướng, câu chốt vô nghĩa).

Sạch rồi thì xuất ảnh (mặc định bản nét 3840×2160):
```bash
node scripts/render.mjs <id>
```

Báo cáo cho người dùng (tiếng Việt, ngắn gọn):
- Số ảnh, thứ tự; tướng/trang bị mới vừa tải.
- **Các câu chốt là bản nháp của bạn** — người dùng sửa được trong `patches/<id>/patch.json`.
- Những chỗ .md mơ hồ/bạn phải đoán.
- Gửi `review/<id>-tong-hop.png` (SendUserFile nếu có) để họ xem nhanh; ảnh thật nằm trong `patches/<id>/out/` và trên trang quản lý (`start.bat` → Làm mới).
- Không commit/push trừ khi người dùng yêu cầu.

## Thiết kế đã chốt — đừng đổi
Người dùng đã duyệt giao diện; sửa CSS để "cứu" một ảnh sẽ làm lệch cả bộ.
- Chỉ khổ **16:9** (khổ 9:16 và 1:1 đã bị bỏ theo yêu cầu).
- Ảnh tổng quan: không hiện tên tướng, icon kỹ năng lưới 4 cột.
- Nhãn trạng thái chỉ "BUFF"/"NERF"/"ĐIỀU CHỈNH", không chữ phụ.
- Mọi ảnh trang bị cùng cỡ biểu tượng và cỡ tên.
- Ảnh bị chật/tràn → sửa **dữ liệu** (rút câu chốt, tách/gộp dòng), không sửa CSS. Nếu thật sự cần đổi thiết kế, hỏi người dùng trước.
