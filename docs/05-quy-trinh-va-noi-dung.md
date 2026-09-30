# 05 — Quy trình mỗi patch & chiến lược nội dung

## 1. Lịch ra patch (dữ liệu thật từ trang tin chính thức)

| Bản | Ngày đăng | Giờ Việt Nam |
|---|---|---|
| 7.1d | Thứ Ba 28/04/2026 | 16:00 |
| 7.1e | Thứ Tư 13/05 | 16:00 |
| 7.1f | Thứ Tư 27/05 | 16:00 |
| 7.1g | Thứ Tư 10/06 | 16:00 |
| 7.1h | Thứ Tư 24/06 | 16:00 |
| **7.2** (bản lớn: làm lại hệ thống Ma Pháp) | Thứ Sáu 03/07 | 09:00 |
| 7.2a | Thứ Tư 15/07 | 16:00 |
| 7.2b | Thứ Tư 29/07 | 16:00 |

**Quy luật:**
- Bản nhỏ (a, b, c…) ra **2 tuần/lần**, thường vào **thứ Tư lúc 16:00 giờ VN**.
- Bản lớn (x.y) có bài giới thiệu riêng, ra giờ khác.
- Trang tin còn có các bài "Cập Nhật Về Phát Hành Tướng" ra trước bản lớn → nguồn cho nội dung "sắp có gì".

> ⏰ **Hệ quả:** chiều thứ Tư cách tuần, **15:45 ngồi vào máy**. Mục tiêu **đăng trước 17:00**, tức là chậm nhất khoảng 1 giờ sau khi Riot đăng. Tốc độ là lợi thế lớn nhất với dạng nội dung này.
> Ghi chú: bài mới nhất thấy được lúc khảo sát là 7.2b (29/07). Nên theo dõi trang tin để cập nhật lại lịch.

## 2. Quy trình sản xuất (mục tiêu ≤ 60 phút)

```
T+0'   Riot đăng patch notes
  │
  ├─ [2']  node scripts/import-patch.mjs <url>        → patch.json bản nháp (🤖 số liệu, gợi ý buff/nerf)
  │
  ├─ [25'] BIÊN TẬP (phần quan trọng nhất)
  │        • Đọc lý do của Riot + số liệu từng tướng
  │        • Chốt status + level cho từng tướng/trang bị
  │        • Viết câu chốt (≤ 20 từ)
  │        • Viết tiêu đề ảnh bìa, sắp thứ tự ảnh
  │
  ├─ [10'] Xem cả bộ trên studio.html → sửa chỗ tràn chữ, cắt splash lệch
  │
  ├─ [3']  node scripts/render.mjs 7.2b              → PNG 16:9 + 9:16
  │
  ├─ [5']  SOÁT LỖI (checklist mục 6)
  │
  └─ [10'] Đăng Facebook (album 16:9) + TikTok (carousel 9:16 + nhạc)
T+55'
```

**Mẹo tiết kiệm thời gian:**
- Thường có **tin sớm** về thay đổi trước khi patch ra (thông báo từ đội phát triển, máy chủ thử nghiệm). Có thể **viết nháp câu chốt trước** rồi chỉ cần sửa số.
- Làm sẵn **câu chốt mẫu** cho các kiểu thay đổi hay gặp:
  - Giảm giáp/kháng phép cơ bản → *"… dễ bị bắt nạt ở đường hơn"*
  - Giảm hồi chiêu chiêu cuối → *"… tham gia giao tranh nhiều hơn"*

## 3. Thứ tự ảnh trong 1 bài

| # | Ảnh | Mục đích |
|---|---|---|
| 0 | **Bìa** | Giữ chân người xem: tiêu đề gây tò mò + số buff/nerf |
| 1 | **Tổng quan** | Tìm ngay tướng mình chơi |
| 2…n | **Chi tiết tướng** | Xếp theo **độ quan tâm**: tướng đang mạnh trong meta / nhiều người chơi / thay đổi lớn → lên trước. Tướng ít người chơi → xuống sau |
| n+1 | **Trang bị** (gộp nếu ít) | Ảnh hưởng đến cách lên đồ |
| cuối | **Tổng kết "Thắng lớn / Thua đau"** + kêu gọi hành động | Tạo bình luận, kéo người theo dõi |

- TikTok carousel cho đăng tối đa **35 ảnh**, Facebook album thoải mái. Nhưng **nên giữ 8–14 ảnh**, nhiều hơn người xem sẽ bỏ giữa chừng.
- Patch lớn (20+ tướng) → chia **2 bài**: "Phần 1: Buff", "Phần 2: Nerf". Được thêm 1 lượt đăng, tiếp cận nhiều hơn.

## 4. Caption & hashtag

**Mẫu caption Facebook:**
```
⚡ CẬP NHẬT 7.2b — 10 TƯỚNG BỊ ĐỘNG CHẠM

▲ BUFF: Lee Sin, Aurora, Ekko
▼ NERF: Ambessa, Sona, Zilean, Jayce, Nidalee, Hecarim
⇄ ĐIỀU CHỈNH: Kayle
🛡️ Trang bị: Vọng Âm Luden, Găng Tay Băng Giá, Súng Từ Trường, Nỏ Thần Dominik, Đoản Đao Navori được tăng sức mạnh

👉 Lướt ảnh để xem chi tiết từng tướng.
💬 Main của bạn bị buff hay nerf? Bình luận nhé!

Nguồn: Patch notes chính thức.
[Tên kênh] was created under Riot Games' "Legal Jibber Jabber" policy using assets owned by Riot Games. Riot Games does not endorse or sponsor this project.

#tocchien #wildrift #lienminhtocchien #wildriftvn #patch72b #metatocchien
```
*(Cách phân loại trên chỉ là ví dụ minh hoạ.)*

**Caption TikTok:** ngắn hơn. Chỉ 1 dòng hook + 3–5 hashtag + câu hỏi. Chọn nhạc đang thịnh hành, để âm lượng nhỏ.

**Hashtag:**

| Loại | Hashtag |
|---|---|
| Cố định | `#tocchien` `#wildrift` `#lienminhtocchien` |
| Theo patch | `#patch72b` |
| Theo tướng (2–3 tướng hot nhất) | `#leesin` `#ambessa` |
| Theo khu vực | `#wildriftvn` |

## 5. Ý tưởng series ngoài patch
<a id="series"></a>

Patch chỉ có 2 tuần/lần. Để kênh đều bài, nên có nội dung ở giữa:

| Series | Mô tả | Dùng lại template nào |
|---|---|---|
| **"Ai hưởng lợi?"** (2–3 ngày sau patch) | Top 5 tướng mạnh lên nhờ patch, kể cả tướng không bị sửa trực tiếp (vd đồ họ dùng được buff) | Ảnh tổng quan dạng thang đo |
| **"Build mới sau patch"** | Trang bị thay đổi → gợi ý lối lên đồ mới cho 1 tướng | Ảnh chi tiết trang bị |
| **"Soi tướng"** | 1 tướng/bài: bộ kỹ năng, mẹo chơi. Dùng icon skill + video demo skill có sẵn | Ảnh chi tiết tướng |
| **"Tin sớm"** | Thay đổi sắp tới lấy từ thông báo trước của đội phát triển / máy chủ thử nghiệm | Tổng quan + chi tiết, có dán nhãn **"CHƯA CHÍNH THỨC"** |
| **"Lịch sử cân bằng"** | "Lee Sin qua 5 patch: buff–nerf–buff…" | Cần lưu lịch sử `patch.json` |
| **"Tướng mới"** | Khi có tướng mới: bộ ảnh giới thiệu từng skill | Ảnh chi tiết (dạng rework/new) |

> ⚠️ Nội dung "tin sớm" và "chưa chính thức" **phải ghi rõ nhãn** trên ảnh. Tin sai mà trình bày như tin thật sẽ làm mất uy tín nhanh hơn mọi thứ khác.

## 6. Checklist trước khi đăng

- [ ] Số patch trên mọi ảnh đúng (không còn sót "7.2a" của bài trước)
- [ ] Đối chiếu **3 tướng ngẫu nhiên** với patch notes gốc, từng con số
- [ ] Không còn dòng nào đánh dấu `unknown` chưa xem
- [ ] Trạng thái BUFF/NERF khớp với số liệu (nhất là **chỉ số ngược**: hồi chiêu, năng lượng, giá)
- [ ] Câu chốt: không sai chính tả, ≤ 20 từ, không khẳng định quá đà ("vô dụng", "phế")
- [ ] Không có chữ tràn hoặc bị cắt (render không in cảnh báo autofit)
- [ ] Xem bản 9:16 trên điện thoại thật ít nhất 1 lần mỗi khi đổi thiết kế
- [ ] Caption có câu miễn trừ Riot + nguồn

## 7. Chỉ số đo hiệu quả (sau khoảng 4–6 patch)

| Chỉ số | Cho biết điều gì | Hành động |
|---|---|---|
| Thời gian từ lúc Riot đăng → lúc bạn đăng | Tốc độ | Rút ngắn khâu biên tập, tự động hoá thêm |
| Tỉ lệ lướt hết carousel (TikTok có số liệu này) | Bộ ảnh có quá dài/nhàm không | Cắt bớt ảnh, sắp lại thứ tự |
| Lượt lưu, chia sẻ | Ảnh có đáng giữ lại không | Nếu thấp: thêm giá trị (câu chốt, gợi ý build) |
| Bình luận | Có tạo tranh luận không | Thử ảnh "thang đo", câu hỏi cuối bài |
| Lượt theo dõi mới mỗi bài | Kênh có tăng trưởng không | So sánh 16:9 và 9:16 trên TikTok |
