# Viết câu chốt, tiêu đề

Câu chốt là thứ khiến người xem theo dõi kênh thay vì tự đọc patch notes: nó trả lời **"thay đổi này có ý nghĩa gì với trận đấu của tôi?"**. Số liệu đã có trên ảnh — câu chốt không nhắc lại số, mà nói **hệ quả**.

## Câu chốt (`verdict`)

- **≤ 100 ký tự**, lên ảnh thành 2–3 dòng. Dài hơn sẽ đè chân ảnh (audit báo lỗi).
- Giọng game thủ trẻ Việt Nam: gọn, có nhịp, dùng từ quen trong game (combo, dồn, gank, đi rừng, đường Rồng / đường Baron, lên đồ, chí mạng, AD/AP, trâu, đau, lên hương, hụt hơi…). Không dùng từ tục; không phán quá đà ("phế", "vô dụng", "hết thời").
- Bám **số liệu và lý do trong .md**, không bịa cơ chế. Không chắc tác động → nói theo hướng an toàn ("đầu trận yếu đi").
- Cấu trúc hay dùng: **[điều thay đổi chính], [điều thứ hai] — [hệ quả cho người chơi]**. Dấu gạch dài `—` tách phần hệ quả.
- Tướng/trang bị vừa tăng vừa giảm: nói rõ bên nào nặng hơn.

Ví dụ đã được duyệt (patch 7.3a):

| Mục | Câu chốt |
|---|---|
| Samira (buff sát thương + chỉ số) | Trâu hơn, đau hơn: một pha lướt vào kèm chiêu cuối giờ đủ quét sạch cả giao tranh. |
| Tristana (buff Q/W/E) | Nhảy liên tục hơn, bom E nổ to hơn — Tristana lên đồ chí mạng sẽ đè đường cực gắt. |
| Hwei (nerf, đầu game tăng nhẹ) | Đầu game vẫn ổn nhưng về cuối hụt sát thương — Hwei khó gánh một mình như trước. |
| Rammus (nerf đầu trận) | Đầu trận mỏng hơn, dọn rừng chậm hơn; W cấp tối đa giữ nguyên nên về sau vẫn cứng. |
| Senna (số tăng nhưng thực chất nerf) | Đừng nhìn con số 1,1: tốc đánh tổng thể giảm, Senna mạnh lên cuối trận chậm hẳn. |
| Yun Tal (buff, hồi chiêu tăng) | Bắn nhanh hơn hẳn mỗi lần kích hoạt, chỉ phải chờ lâu hơn chút — xạ thủ chí mạng vẫn lời to. |
| Death's Dance (chỉ tăng giá) | Chỉ đắt thêm 100 vàng — Vũ Điệu Tử Thần vẫn là món trâu đáng mua cho đấu sĩ. |

## Dòng tiêu đề ảnh tổng quan (`headline`)

3 cụm ngắn (2–4 chữ mỗi cụm) tóm xu hướng cả patch, nối bằng ` · `:
- 7.3a: `Xạ thủ trỗi dậy · Rừng chậm lại · Nexus mỏng hơn`
- Nhìn nhóm tướng được buff/nerf nhiều nhất (theo vai trò), thay đổi hệ thống nổi bật.
- Không quá ~50 ký tự để vừa một dòng.

## Câu chốt ảnh hệ thống (`systemsVerdict`)

Một câu nói hệ quả chung của các thay đổi hệ thống/bản đồ, ≤ 100 ký tự.
- 7.3a: `Rừng chậm lại, trụ và Nhà Chính mỏng hơn: trận đấu sẽ ngắn hơn, đội nào đẩy nhanh đội đó thắng.`

## Nhớ nói với người dùng
Câu chốt là **bản nháp của Claude** — liệt kê chúng trong báo cáo để người dùng đọc nhanh và sửa trong `patch.json` nếu muốn giọng khác.
