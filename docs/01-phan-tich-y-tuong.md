# 01 — Phân tích ý tưởng

## 1. Mình hiểu yêu cầu như sau

| Hạng mục | Nội dung |
|---|---|
| Game | Liên Minh Huyền Thoại: **Tốc Chiến** (Wild Rift). Khoảng 2 tuần có 1 bản cập nhật cân bằng |
| Kênh | TikTok + Facebook, chủ đề: cập nhật meta / cân bằng game |
| Sản phẩm | Bộ **ảnh 16:9** cho mỗi bản cập nhật |
| Ảnh 1 — Tổng quan | Toàn bộ tướng + trang bị bị thay đổi, mỗi cái gắn trạng thái **BUFF** hoặc **NERF** |
| Ảnh 2..n — Chi tiết | Mỗi tướng (hoặc trang bị) 1 ảnh gồm: ảnh tướng, icon skill, tên skill, số liệu tăng/giảm, và **1 câu chốt** về ảnh hưởng |
| Công nghệ | HTML + CSS + JS thuần, không dùng framework frontend. Được dùng Tailwind/SCSS |
| Nguồn ảnh | Trang tướng chính thức, ggmeo.com, hoặc nguồn khác tốt hơn |

## 2. Người xem là ai, họ cần gì?

**Chân dung người xem:** người chơi Tốc Chiến ở Việt Nam, đa số xem trên điện thoại, lướt nhanh.

Họ hỏi đúng 3 câu, theo thứ tự:

1. **"Tướng tôi hay chơi có bị động không?"** → ảnh tổng quan phải cho tìm ra tướng trong **2–3 giây**. Nhận ra nhờ ảnh chân dung, không phải nhờ đọc chữ.
2. **"Bị nerf/buff nặng không?"** → ảnh chi tiết phải cho thấy **mức độ**: đổi bao nhiêu, bao nhiêu %. Không chỉ ghi "46 → 37".
3. **"Vậy giờ nên chơi gì / lên đồ gì?"** → **câu chốt**. Đây là thứ patch notes của Riot không có, và là lý do người ta follow kênh bạn chứ không đọc thẳng patch notes.

> 💡 **Giá trị cốt lõi của kênh = Nhanh + Dễ hiểu + Có quan điểm.**
> Số liệu thì ai cũng copy được. Câu chốt và cách trình bày mới là thứ riêng của bạn.

## 3. Phân tích nền tảng

### Facebook
- Ảnh 16:9 hiển thị tốt trong bảng tin (bài 1 ảnh hoặc album nhiều ảnh).
- Album nhiều ảnh: Facebook ghép 3–5 ảnh đầu thành khung lưới. **Ảnh đầu tiên được hiển thị to nhất.**
- Phù hợp với caption dài và thảo luận trong bình luận.

<a id="tiktok"></a>

### TikTok — ⚠️ vấn đề lớn nhất
- TikTok là nền tảng **dọc 9:16**. Ảnh 16:9 trong chế độ ảnh (Photo Mode / carousel) sẽ bị **thu nhỏ vào giữa, trên dưới là viền đen**.
- Tính thử: ảnh 1920px chiếu lên màn hình điện thoại rộng khoảng 390pt → **thu nhỏ còn khoảng 20%**. Chữ cỡ 40px trong ảnh chỉ còn **~8pt** trên máy, rất khó đọc.
- TikTok ưu tiên video. Carousel ảnh có kèm nhạc vẫn được đẩy tốt, nhưng video thường tiếp cận được nhiều người hơn.

**Ba phương án cho TikTok:**

| Phương án | Mô tả | Ưu | Nhược |
|---|---|---|---|
| A. Giữ 16:9 | Đăng y bản Facebook | Không tốn thêm công | Chữ nhỏ, phí 60% màn hình |
| **B. Khung dọc 9:16 (đề xuất)** | Canvas 1080×1920: ảnh 16:9 ở giữa. Phía trên là tiêu đề to (tên tướng + BUFF/NERF). Phía dưới là câu chốt to | Tận dụng màn hình, chữ to, trông chuyên nghiệp | Thêm 1 template (dùng lại dữ liệu nên không tốn nhiều) |
| C. Video slideshow | Ghép PNG thành video có chuyển cảnh + nhạc (dùng ffmpeg) | Được thuật toán ưu tiên | Làm ở giai đoạn sau |

> ✅ **Đề xuất:** thiết kế **16:9 làm bản gốc** (đúng như bạn muốn). Chữ to, ít chữ để khi thu nhỏ vẫn đọc được. Vì ảnh dựng bằng HTML nên xuất thêm bản **9:16 cho TikTok** chỉ là thêm 1 file CSS. Chi tiết ở [03-thiet-ke-hinh-anh.md](03-thiet-ke-hinh-anh.md#bien-the-9-16).

## 4. Điểm khác biệt so với kênh khác

| Kênh thông thường | Kênh của bạn nên làm |
|---|---|
| Chụp màn hình patch notes / chép chữ | Ảnh thiết kế riêng, mỗi tướng 1 ảnh, nhận diện bằng màu |
| Chỉ ghi "46 → 37" | Ghi thêm **−9 (−20%)**, có mũi tên hoặc thanh so sánh |
| Không kết luận | **Câu chốt** cho mỗi tướng + ảnh "Ai thắng / Ai thua" |
| Ra chậm 1–2 ngày | Có công cụ tự động → **ra trong ~1 giờ** sau patch notes |
| Mỗi lần một kiểu | Bộ nhận diện cố định: màu, font, vị trí logo, số patch |

## 5. Mở rộng nội dung (ngoài 2 loại ảnh chính)

Bộ ảnh mỗi patch nên có thêm:

- **Ảnh bìa (hook):** ví dụ *"7.2b: 10 TƯỚNG BỊ ĐỘNG CHẠM — LEE SIN LÊN ĐỈNH?"*. Trên TikTok, ảnh đầu tiên chính là thumbnail, quyết định người ta có dừng lại xem không.
- **Ảnh chi tiết trang bị:** patch 7.2b có 5 trang bị thay đổi (Găng Tay Băng Giá, Vọng Âm Luden, Súng Từ Trường, Nỏ Thần Dominik, Đoản Đao Navori) và 1 ngọc (Nhà Thực Vật Học).
- **Ảnh tổng kết "Thắng lớn / Thua đau":** tạo tranh luận ở phần bình luận.
- **Ảnh ngọc bổ trợ / hệ thống:** chỉ làm khi có thay đổi đáng kể.

Ý tưởng series giữa các patch: xem [05-quy-trinh-va-noi-dung.md](05-quy-trinh-va-noi-dung.md#series).

## 6. Rủi ro & cách giảm

| Rủi ro | Mức độ | Cách giảm |
|---|---|---|
| **Sai số liệu** → mất uy tín ngay lập tức | Cao | Lấy số tự động từ patch notes chính thức, không gõ tay. Có checklist soát trước khi đăng |
| **Đánh giá buff/nerf sai** (giảm hồi chiêu là buff chứ không phải nerf) | Trung bình | Công cụ tự đoán theo quy tắc, **người duyệt cuối** (xem file 04, phần bộ phân tích số liệu) |
| **Bản quyền / thương hiệu Riot** | Trung bình | Tuân thủ chính sách "Legal Jibber Jabber": ghi miễn trừ, **không đặt tên kênh chứa thương hiệu Riot**, không dùng logo game (chi tiết ở file 02) |
| Nguồn ảnh đổi cấu trúc / chặn bot | Thấp–TB | Tải ảnh về máy 1 lần (cache), không gọi trực tiếp link ảnh lúc render |
| Chậm hơn đối thủ | Trung bình | Tự động hoá khâu nhập liệu + render. Biết trước giờ ra patch (xem file 05) |
| Ảnh quá nhiều chữ, không ai đọc | Cao | Giới hạn chữ mỗi ảnh (file 03), câu chốt ≤ 20 từ |
| Patch lớn (20+ tướng) làm vỡ bố cục | Trung bình | Bố cục tự co giãn theo số lượng, tự chia thành 2 ảnh tổng quan |
