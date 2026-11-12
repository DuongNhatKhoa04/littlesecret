# Ticket Writer

Tool web 1 trang cho nhân viên support / tech:

- **Viết ticket**: nhập theo mục → tool ghép ra **Title** và **Nội dung** đúng chuẩn để copy (hoặc bookmark *Điền ticket* điền thẳng vào trang ticket).
- **Ảnh bằng chứng**: dán / kéo thả / chụp màn hình vào từng mục, đổi thứ tự, tải ZIP hoặc PDF. Nhận ảnh thẳng từ iPad / iPhone qua mạng LAN (quét mã QR).
- **SMS**: soạn tin Promotion, báo Shipping, xin Review theo mẫu.
- **Ticket offline**: lưu ticket ra file khi ticket system không vào được, mở lại sau.

Chạy hoàn toàn trên máy: không server, không Internet, không cài gì. Dữ liệu chỉ nằm trong trình duyệt của máy đang dùng.

## Dùng

1. Double-click **`index.html`** (Chrome hoặc Edge bản mới).
2. Cạnh tên app hiện `version` (vd `v2026-11-12.14`) để biết đang mở đúng bản.
3. Nhận ảnh từ iPad / iPhone: xem [phone-upload/README.md](phone-upload/README.md).

## Gửi cho đồng nghiệp

Nén **cả folder** (giữ nguyên cấu trúc) → bên kia giải nén → double-click `index.html`. Trước khi gửi bản mới: làm theo [docs/REVIEW.md](docs/REVIEW.md).

Không có gì bí mật nằm trong folder: mã bí mật của phone-upload lưu ở `%LOCALAPPDATA%\TicketWriter\` của từng máy.

## Tài liệu

| Đọc khi | File |
|---|---|
| Muốn biết tool làm gì, đúng tới từng câu chữ | [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md) |
| Thêm / sửa loại ticket, checklist, câu chữ SMS, cảnh báo | [docs/CONFIG.md](docs/CONFIG.md) |
| Sửa code: kiến trúc, quy tắc, cái gì không được phá | [CLAUDE.md](CLAUDE.md) |
| Đụng tới lưu trữ, clipboard, mạng, phone-upload | [docs/SECURITY.md](docs/SECURITY.md) |
| Chuẩn bị gửi bản mới / duyệt thay đổi | [docs/REVIEW.md](docs/REVIEW.md) |
| Chạy test | [tests/README.md](tests/README.md) |
| Bản nào đổi gì | [CHANGELOG.md](CHANGELOG.md) |

## Kiểm tra nhanh

- Double-click `tests/index.html` → dòng đầu phải là `PASS x/x`.
- Có Python 3: `python tests/tools/run_tests.py` và `python tests/tools/smoke_ui.py`.
