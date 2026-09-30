# 06 — Lộ trình triển khai & câu hỏi cần chốt

## 1. Lộ trình theo giai đoạn

### Giai đoạn 0 — Chốt thiết kế (1–2 buổi)
**Mục tiêu:** nhìn thấy ảnh thật trước khi viết công cụ.
- [ ] Bạn trả lời các câu hỏi ở mục 2
- [ ] Làm mockup HTML **ảnh tổng quan** + **ảnh chi tiết** (Lee Sin, Kayle), dùng số liệu 7.2b gõ tay vào JSON
  - Chọn Kayle vì có dòng vừa tăng vừa giảm theo cấp → thử được trường hợp khó
- [ ] Xem trên điện thoại thật, sửa đến khi ưng
- [ ] Chốt: màu, font, logo, vị trí các thành phần

### Giai đoạn 1 — Bản dùng được (MVP)
**Mục tiêu:** đăng được bài patch đầu tiên, dù còn nhập tay.
- [ ] Cấu trúc thư mục + `tokens.css` + template: bìa, tổng quan, chi tiết tướng, trang bị, tổng kết
- [ ] `serve.mjs` + `studio.html` (xem cả bộ ảnh)
- [ ] `render.mjs` (Playwright + Edge) → PNG 16:9
- [ ] Tải tay ảnh của các tướng trong patch đang làm
- [ ] **Đăng bài đầu tiên** 🎉

### Giai đoạn 2 — Tự động hoá
**Mục tiêu:** từ lúc có patch notes đến lúc có ảnh ≤ 60 phút.
- [ ] `sync-champions.mjs`: tải danh bạ 142 tướng + ảnh chân dung, splash, icon skill
- [ ] `import-patch.mjs`: đọc `characterChanges` → `patch.json`, giữ nguyên phần bạn đã viết khi chạy lại
- [ ] `parse-change.js` + bộ test bằng dữ liệu thật
- [ ] Đọc phần trang bị/ngọc từ HTML (có đánh dấu chỗ cần soát)
- [ ] Tải tay bộ icon trang bị + `items.json`

### Giai đoạn 3 — Tối ưu cho TikTok
- [ ] Template 9:16 (`format-9x16.css`)
- [ ] Trang biên tập trên `studio.html`: nhập câu chốt, chọn trạng thái, lưu thẳng vào file
- [ ] Video slideshow bằng ffmpeg (tuỳ chọn: chèn video demo skill)

### Giai đoạn 4 — Mở rộng
- [ ] Gợi ý câu chốt bằng AI từ lý do của Riot
- [ ] Tự phát hiện patch mới và báo cho bạn
- [ ] Lịch sử cân bằng qua nhiều patch, các series nội dung khác ([05](05-quy-trinh-va-noi-dung.md#series))

## 2. Câu hỏi cần bạn chốt
<a id="cau-hoi-can-ban-chot"></a>

### Thương hiệu
1. **Tên kênh / handle** là gì?
   - Lưu ý: theo chính sách Riot, **không nên chứa** "Wild Rift", "Tốc Chiến", "LMHT", "League".
   - Đã có **logo** chưa? Có màu thương hiệu mong muốn không, hay dùng đề xuất xanh đen + vàng Hextech?
2. Phong cách bạn thích: **nghiêm túc, kiểu esport** hay **vui, meme, gần gũi**? Điều này quyết định giọng văn câu chốt và độ "lố" của thiết kế.

### Định dạng
3. TikTok: chấp nhận **đăng 16:9** hay làm thêm **bản 9:16** (đề xuất)?
4. Có muốn **ảnh bìa** và **ảnh tổng kết** không, hay chỉ đúng 2 loại ảnh như ban đầu?

### Nội dung ảnh
5. Trạng thái chỉ cần **BUFF / NERF**, hay thêm **ĐIỀU CHỈNH** (vừa tăng vừa giảm) và **LÀM LẠI**?
6. Có muốn thể hiện **mức độ** (▲ / ▲▲ / ▲▲▲) không? Có mức độ thì làm được ảnh "thang đo", nhưng bạn phải tự chấm.
7. Số liệu theo cấp skill:
   - **(a)** hiện **bảng đủ từng cấp** (chính xác, nhiều số)
   - **(b)** chỉ hiện **cấp tối đa** + "+X mỗi cấp" (gọn, dễ đọc)
8. Ảnh tướng dùng **skin mặc định** hay **skin đẹp/mới nhất**? Skin mặc định dễ nhận ra hơn, skin mới bắt mắt hơn.
9. Có hiện **lý do của Riot** (rút gọn 1 dòng) trên ảnh không, hay chỉ có câu chốt của bạn?

### Quy trình
10. Câu chốt: bạn **tự viết 100%**, hay muốn công cụ **gợi ý nháp** (từ lý do của Riot / AI) để bạn sửa?
11. Bạn có sẵn sàng **tải tay icon trang bị một lần** (~30 phút) không? Hoặc mình làm công cụ hỗ trợ lấy qua trình duyệt.
12. Bạn quen **Tailwind** hay **CSS thuần** hơn? Đề xuất là CSS thuần + biến CSS, nhưng nếu bạn định tự sửa giao diện thì nên chọn cái bạn quen.

## 3. Đề xuất mặc định (nếu bạn muốn làm luôn)

Nếu bạn chưa muốn nghĩ nhiều, mình sẽ làm theo mặc định sau và bạn chỉnh sau:

| Câu hỏi | Mặc định |
|---|---|
| Màu | Nền xanh đen `#0A0E1A`, nhấn vàng `#C8AA6E` |
| Phong cách | Esport, gọn, rõ |
| Định dạng | 16:9 trước, 9:16 ở giai đoạn 3 |
| Loại ảnh | Bìa + Tổng quan + Chi tiết + Trang bị + Tổng kết |
| Trạng thái | BUFF / NERF / ĐIỀU CHỈNH, có mức độ 1–3 |
| Số liệu | Bảng từng cấp, tô màu từng ô |
| Skin | Mặc định |
| Lý do Riot | Không hiện trên ảnh, chỉ dùng để gợi ý câu chốt |
| CSS | CSS thuần + biến CSS |

→ Bước tiếp theo: **mockup Giai đoạn 0 với dữ liệu 7.2b**.
