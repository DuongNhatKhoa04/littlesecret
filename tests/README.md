# Test

## Chạy test (không cần cài gì)

Double-click `tests/index.html`. Dòng đầu hiện `PASS x/x` (xanh) hoặc `FAIL` (đỏ) kèm lỗi.

## Chạy từ terminal (tùy chọn, cần Python 3 + Chrome/Edge)

| Lệnh | Làm gì |
|---|---|
| `python tests/tools/run_tests.py` | Chạy `tests/index.html` bằng Chrome headless, in kết quả. |
| `python tests/tools/smoke_ui.py` | Bấm thử giao diện thật (`index.html`): gõ, phím tắt, chọn theo cấp, dán ảnh, tải ZIP/PDF, template, chế độ xem. Báo cả lỗi JS. Chạy theo giờ thật (~25s): trang gửi kết quả về server tạm trên `127.0.0.1` do script tự mở. |
| `python tests/tools/generate_golden.py` | Sinh lại `golden-expected.js` từ bản gốc `../ticket-writer.html`. |

## Các file

| File | Nội dung |
|---|---|
| `golden-cases.js` | Dữ liệu nhập mẫu (loại ticket, nội dung, tick, số ảnh). |
| `golden-expected.js` | Output chuẩn của **bản gốc** cho từng ca. Sinh tự động, không sửa tay. |
| `golden.test.js` | Bản mới phải ra Title + Nội dung + điều kiện copy giống hệt bản gốc. Không truyền Model nên không có dòng `Model:` (REQUIREMENTS §14.3). Ca nào cố ý khác vì đổi config checklist thì ghi trong `CHANGED_SINCE_ORIGINAL` (chỉ ghi đè trường bị ảnh hưởng; nội dung chỉ được nối thêm vào sau bản gốc). |
| `domain.test.js`, `navigation.test.js` | Quy tắc nghiệp vụ. |
| `config.test.js` | Config hợp lệ: key loại cũ còn đủ, meta khớp catalog, id mục duy nhất. |
| `application.test.js` | Đọc state bản cũ, lưu state, thao tác sửa ticket (storage giả). |
| `sms.test.js` | SMS Promotion: tin nhắn đúng mẫu, trường còn thiếu, đọc/lưu state, Kết quả không có title. |
| `shipping.test.js` | SMS Shipping: tin nhắn đúng mẫu, trường còn thiếu, đọc/lưu state, Kết quả không có title. |

## Thêm test

1. Viết `test('tên', () => { ... })` bằng `assert` / `assertEqual` từ `TW.tests`.
2. File test mới → thêm `<script>` vào `tests/index.html` trước `run.js`.
3. File config mới → thêm `<script>` vào **cả** `index.html` và `tests/index.html`.
