# Test

## Chạy test (không cần cài gì)

Double-click `tests/index.html`. Dòng đầu hiện `PASS x/x` (xanh) hoặc `FAIL` (đỏ) kèm lỗi.

## Chạy từ terminal (tùy chọn, cần Python 3 + Chrome/Edge)

| Lệnh | Làm gì |
|---|---|
| `python tests/tools/run_tests.py` | Chạy `tests/index.html` bằng Chrome headless, in kết quả. |
| `python tests/tools/smoke_ui.py` | Bấm thử giao diện thật (`index.html`): gõ, phím tắt, chọn theo cấp, ô Loại, dán / chụp / kéo đổi thứ tự / xóa hết ảnh, tải ZIP/PDF, template, ticket offline, SMS, giao diện sáng/tối, nút Nhận ảnh iOS, chế độ xem. Báo cả lỗi JS. Chạy theo giờ thật (~30s), tối đa 120s: trang gửi kết quả về server tạm trên `127.0.0.1` do script tự mở. Treo tới 120s thường là lỗi cú pháp trong `smoke_ui.js` (vd khai báo `const` trùng tên). |
| `python tests/tools/generate_diagrams.py` | Sinh lại 4 sơ đồ trong `docs/diagrams/` (architecture, dependency, uml-class, sequence). Nội dung viết tay trong script. |
| `python tests/tools/generate_tree.py` | Sinh lại `docs/diagrams/tree.html`, đếm số file từ ổ đĩa. |
| `python tests/tools/generate_golden.py` | Sinh lại `golden-expected.js` từ bản gốc. **Cần file `../ticket-writer.html`** (cạnh folder dự án), hiện **không có** trong repo → không chạy được; giữ nguyên `golden-expected.js`. |

## Các file

| File | Nội dung |
|---|---|
| `golden-cases.js` | Dữ liệu nhập mẫu (loại ticket, nội dung, tick, số ảnh). |
| `golden-expected.js` | Output chuẩn của **bản gốc** cho từng ca. Sinh tự động, **không sửa tay**. |
| `golden.test.js` | Bản mới phải ra Title + Nội dung + điều kiện copy giống hệt bản gốc. Không truyền Model nên không có dòng `Model:` (REQUIREMENTS §14.3). Ca nào cố ý khác vì đổi config checklist thì ghi trong `CHANGED_SINCE_ORIGINAL` (chỉ ghi đè trường bị ảnh hưởng; nội dung chỉ được nối thêm vào sau bản gốc). |
| `domain.test.js`, `navigation.test.js` | Quy tắc nghiệp vụ. |
| `config.test.js` | Config hợp lệ: key loại cũ còn đủ, meta khớp catalog, id mục duy nhất. |
| `application.test.js` | Đọc state bản cũ, lưu state, thao tác sửa ticket (storage giả). Ảnh: nạp lại từ IndexedDB (giả), lưu theo mục, đổi thứ tự, Ticket mới trong lúc đang nạp. |
| `notice.test.js` | Cảnh báo lưu trữ: bật / tắt / ẩn bằng ×, ngưỡng sắp đầy, ảnh không lưu được. |
| `theme.test.js` | Nút giao diện: mặc định Tự động, xoay vòng, lưu lựa chọn. |
| `phone.test.js` | Nhận ảnh iOS: đọc link máy tính, hỏi hàng chờ, giao ảnh, mất kết nối, link iPad / đổi mã. Mã QR: kích thước, ô tìm vị trí, chọn phiên bản theo độ dài. |
| `summary-history.test.js` | Gợi ý Tóm tắt: dữ liệu hỏng, mới nhất đầu, không trùng, xóa 1 gợi ý. |
| `sms.test.js` | SMS Promotion: tin nhắn đúng mẫu, trường còn thiếu, đọc/lưu state, khối SMS trong Hỗ trợ merchant: chi tiết SMS vào mục Đã support, không đụng title. |
| `shipping.test.js` | SMS Shipping: tin nhắn đúng mẫu, trường còn thiếu, đọc/lưu state, Kết quả không có title. |
| `review.test.js` | SMS Xin review: bảng bang → chi nhánh → link, tin nhắn 2 ngôn ngữ, đọc/lưu state, Kết quả không có title, tên nhân viên. |
| `offline.test.js` | Ticket offline: mã OFF-…, mỗi lần lưu chỉ tải 1 file (ZIP chứa JSON + ảnh + PDF cùng tên), đọc file, mở lại vào form. Test async (runner chờ từng test). |

## Chưa có test tự động

Những phần sau đang kiểm bằng tay (checklist ở [docs/REVIEW.md](../docs/REVIEW.md)). Sửa vùng này thì tự thử lại:

| Phần | Vì sao chưa có | Kiểm tay thế nào |
|---|---|---|
| `phone-upload/phone-upload.ps1` (server) | Test hiện chỉ có phía Ticket Writer với hàng chờ giả | Chạy `phone-upload.ps1 -Port 8799 -LocalOnly` rồi gọi bằng `curl`: trang iPad, `/check`, `/upload`, `/next`, `/info`, `/rotate`, mã sai → 404 / 410 |
| phone-upload chặn request không phải loopback | `-LocalOnly` không nghe LAN; nghe LAN thì bật hộp Tường lửa | Từ máy khác cùng mạng gọi `http://<IP>:8765/<mã máy tính>/next` → phải 404 |
| Mã QR đọc được bằng camera thật | Unit test chỉ kiểm cấu trúc; đã kiểm 1 lần bằng OpenCV (14 chuỗi, phiên bản 1–6) | iPad quét mã trong hộp Nhận ảnh iOS |
| Bookmark *Điền ticket* trên trang ticket thật | Trang bên ngoài | Copy để điền → bấm bookmark trên trang ticket |
| Màu / bố cục (sáng, tối) | Chưa có so sánh ảnh | Mở cả 2 giao diện, nhìn chỗ vừa sửa |

## Thêm test

1. Viết `test('tên', () => { ... })` bằng `assert` / `assertEqual` từ `TW.tests` (hàm `async` được, runner chờ từng test).
2. File test mới → thêm `<script>` vào `tests/index.html` trước `run.js`.
3. File config / domain / application mới → thêm `<script>` vào **cả** `index.html` và `tests/index.html`.
4. Đổi UI → thêm bước vào `tests/tools/smoke_ui.js`. Đặt tên biến không trùng với biến đã có trong file (cả file là 1 hàm).
