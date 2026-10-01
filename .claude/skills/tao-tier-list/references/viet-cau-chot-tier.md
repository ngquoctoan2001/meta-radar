# Viết câu chốt, tiêu đề, ghi chú cho tier list

Đây là giá trị riêng của kênh: nối số liệu bảng xếp hạng với **bản cập nhật** (và với **tier list kỳ trước** nếu có). Lấy ý từ `node scripts/tierlist.mjs compare <id>`. Đọc thêm `patches/<patch>/patch.json` (câu chốt từng tướng/trang bị/hệ thống) để hiểu vì sao.

## Các trường

| Trường | Hiện ở đâu | Độ dài |
|---|---|---|
| `lanes[].verdict` | ô CHỐT ở ảnh từng đường | nhắm **~90 ký tự** (2 dòng). Đường 0–1 T0: tới ~100 thường vẫn vừa; 2 T0 (khung hẹp): ≤ ~90; 3 T0 (chỉ còn câu chốt): ~115. `compare` in độ dài, **audit quyết định** có vừa không |
| `headline` | dòng lớn ở ảnh tổng quan | 3 cụm ngắn nối bằng ` · `, tổng ≤ ~55 ký tự |
| `note` | ô vàng có đồng hồ ở ảnh tổng quan (tùy chọn) | ≤ ~60 ký tự |

Audit báo khi câu chốt tràn khung → rút ngắn, đừng sửa CSS.

## Ý hay cho câu chốt (theo nhãn của `compare`)

- **NERF mà vẫn T0/T1**: "Hwei vẫn là T0 duy nhất và bị cấm 83,89%".
- **BUFF vừa vào nhóm / LÊN**: "Samira vừa được buff đã vào T1".
- **XUỐNG / rời khỏi T0–T1** (chỉ khi có `previous`): "Malphite rơi khỏi T0 sau đợt nerf".
- **Có trong bản cập nhật mà vắng mặt**: "Caitlyn sau nerf vắng mặt trong nhóm này".
- **Cấm rất cao (≥ 50%)**: "Nocturne chỉ T1 nhưng bị cấm tới 65%".
- **Không có T0**: "Không ai đủ sức lên T0".
- **Hệ quả của trang bị/hệ thống**: "Rammus vẫn đứng đầu dù rừng chậm hơn"; "Vòng Thì Thầm vừa bị cắt nửa hiệu quả, T1 giờ là…".

## Quy tắc người dùng đã nhắc

- **Đừng lặp "ăn nerf 7.3a"** ở mọi câu chốt đường (`headline` không tính). Thẻ tướng đã tự gắn nhãn NERF/BUFF. Cả bộ tối đa 1–2 câu nhắc thẳng chữ buff/nerf; còn lại nói hệ quả hoặc con số.
- **Chỉ nói điều số liệu chứng minh được.** Không có `previous` thì không viết "rớt hạng", "tụt khỏi T0", "lên hạng"; chỉ nói trạng thái hiện tại ("vẫn trụ T1", "vắng mặt").
  Nhận xét về **bối cảnh thời gian** thì được phép dù không có kỳ trước ("7.3a mới ra 1 ngày", "nerf chưa kịp ngấm") — đó là nhận định có căn cứ (số ngày), không phải khẳng định thứ hạng đã đổi.
- **Bản cập nhật mới ra vài ngày** (`new`/`compare` in số ngày; ≤ 3 ngày): ghi `note` kiểu "7.3a mới cập nhật 1 ngày — bảng xếp hạng chưa kịp đổi nhiều". `headline`/câu chốt nên ăn khớp ("Nerf chưa kịp ngấm"). Lâu hơn thì bỏ `note` hoặc ghi bối cảnh khác ("1 tuần sau 7.3a").
- Giọng văn: tiếng Việt tự nhiên của dân chơi Tốc Chiến, ngắn, có số liệu cụ thể (dùng dấu phẩy thập phân: 56,34%).

## Ví dụ đã duyệt (tier-2026-09-30, sau 7.3a 1 ngày, chưa có kỳ trước)

- headline: "Nerf chưa kịp ngấm · Samira lên T1 · Đường Rồng vắng T0"
- note: "7.3a mới cập nhật 1 ngày — bảng xếp hạng chưa kịp đổi nhiều"
- Baron: "Singed độc chiếm T0. Malphite vẫn trụ T1 và bị cấm tới 68% — người chơi chưa hết sợ."
- Rừng: "Rammus vẫn đứng đầu với 56,34% thắng dù rừng chậm hơn. Nocturne chỉ T1 nhưng bị cấm tới 65%."
- Giữa: "Hwei vẫn là T0 duy nhất và bị cấm 83,89% — gần như trận nào cũng cấm. Syndra vẫn trụ T1."
- Rồng: "Không ai đủ sức lên T0. Samira vừa được buff đã vào T1, còn Caitlyn sau nerf vắng mặt trong nhóm này."
- Hỗ trợ: "Senna giữ T0. Vòng Thì Thầm vừa bị cắt nửa hiệu quả, T1 giờ là Thresh, Malphite, Morgana."

Độ dài 84–101 ký tự, đều vừa 2 dòng (các đường này có 0–1 T0).
