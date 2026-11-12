# Nhận ảnh từ iPad / iPhone

Chụp màn hình trên iPad / iPhone (vd lúc FaceTime) rồi gửi thẳng vào Ticket Writer qua mạng LAN, không cần chuyển qua Telegram. Không cần Internet, không cần cài gì thêm trên máy tính. Hợp với **iPad dùng chung**: iPad chỉ cần quét mã QR, không phải gõ link.

## Lần đầu trên máy tính (1 lần)

1. Double-click **`phone-upload.bat`**. Cửa sổ đen hiện ra, giữ nó mở trong lúc làm.
   - Windows hỏi **Tường lửa (Windows Defender Firewall)** → chọn **Private networks** → **Allow access**. Máy công ty có thể cần IT bấm giúp.
2. Ticket Writer: bấm nút **`Nhận ảnh iOS`** ở header → **Ctrl+V** (link mục 1 `http://127.0.0.1:8765/...` đã được copy sẵn) → OK.
   - Link `127.0.0.1` là **đúng**: Ticket Writer và cửa sổ đen chạy trên cùng máy. Link này chỉ dùng trên máy tính, không mở trên iPad.

## Mỗi ca / mỗi ngày

1. Double-click `phone-upload.bat` (nếu chưa mở).
2. Ticket Writer tự bật lại nhận ảnh khi mở trang. Nút ghi `Mất kết nối` → bấm nút → Enter.
3. Bấm nút **`Đang nhận ảnh`** → hiện **mã QR**.
4. iPad: mở **Camera**, hướng vào mã QR → bấm link hiện ra → **Chọn ảnh để gửi**. Ảnh tự vào **mục đang mở** trên Ticket Writer, giống Ctrl+V (tự tick checklist).

## Mã iPad hết hạn

- Mã trong QR **tự đổi sau 12 tiếng**. Trang gửi ảnh cũ trên iPad báo "Mã đã hết hạn" → bấm nút trên Ticket Writer, quét mã mới.
- **Đổi ca trên iPad dùng chung**: bấm **Đổi mã ngay** trong hộp mã QR. Trang gửi ảnh người trước còn mở trên iPad sẽ không gửi được vào máy bạn nữa.

## Lưu ý

- Ảnh chỉ đi trong mạng LAN, giữ trong bộ nhớ cửa sổ đen tới khi Ticket Writer lấy. Tắt cửa sổ đen là ảnh chưa lấy bị xóa (ảnh gốc vẫn còn trên iPad).
- 2 mã bí mật, lưu ở `%LOCALAPPDATA%\TicketWriter\` (vd `C:\Users\<tên>\AppData\Local\TicketWriter\`), **ngoài** folder này nên nén folder gửi đồng nghiệp không mang mã theo:
  - `phone-upload-token.txt`: **mã máy tính**, cố định. Chỉ nhận từ chính máy này: iPad / máy khác biết mã cũng không lấy được ảnh.
  - `phone-upload-session.txt`: **mã iPad**, tự đổi sau 12 tiếng.
- Nhiều người cùng mạng không bị lẫn ảnh: mã QR của mỗi máy chứa IP của đúng máy đó.
- Không chạy được:
  - Wi-Fi khách / Wi-Fi công cộng thường chặn các máy nói chuyện với nhau → dùng Wi-Fi nội bộ.
  - IP máy tính đổi (đổi mạng, khởi động lại router) → tắt / mở lại cửa sổ đen rồi quét mã mới.
  - Màn hình đang mở không có ô dán ảnh (vd SMS Shipping) → ảnh chờ trong cửa sổ đen, chuyển sang ticket là ảnh vào.
- Port mặc định `8765`. Bị trùng thì sửa dòng `param([int]$Port = 8765 ...)` trong `phone-upload.ps1` rồi dán lại link mục 1 mới vào Ticket Writer.
