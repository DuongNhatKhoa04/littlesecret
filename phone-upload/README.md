# Nhận ảnh từ iPhone / iPad

Chụp màn hình trên iPhone / iPad (vd lúc FaceTime) rồi gửi thẳng vào Ticket Writer qua mạng LAN, không cần chuyển qua Telegram. Không cần Internet, không cần cài gì thêm trên máy tính.

## Lần đầu

1. Double-click **`phone-upload.bat`**. Cửa sổ đen hiện ra, giữ nó mở trong lúc làm.
   - Windows hỏi **Tường lửa (Windows Defender Firewall)** → chọn **Private networks** → **Allow access**. Máy công ty có thể cần IT bấm giúp.
2. Ticket Writer: bấm nút **`Nhận ảnh iOS`** ở header → **Ctrl+V** (link đã được copy sẵn) → OK. Nút đổi thành `Đang nhận ảnh`.
3. iPhone / iPad (**cùng Wi-Fi** với máy tính): mở **Safari**, gõ link màu vàng trong cửa sổ đen (dạng `http://192.168.x.x:8765/...`).
   - Bấm **Chia sẻ → Thêm vào MH chính** để lần sau bấm icon là mở.

## Hằng ngày

1. Double-click `phone-upload.bat`.
2. Ticket Writer tự bật lại nhận ảnh khi mở trang (nếu lần trước đang bật). Nút ghi `Mất kết nối` → bấm nút → Enter.
3. iPhone: mở icon "Gửi ảnh" → **Chọn ảnh để gửi** → chọn 1 hoặc nhiều ảnh. Ảnh tự vào **mục đang mở** trên Ticket Writer, giống Ctrl+V (tự tick checklist).

## Lưu ý

- Ảnh chỉ đi trong mạng LAN, giữ trong bộ nhớ cửa sổ đen tới khi Ticket Writer lấy. Tắt cửa sổ đen là ảnh chưa lấy bị xóa (ảnh gốc vẫn còn trên iPhone).
- Link có **mã bí mật** riêng của từng máy: máy khác trong LAN không biết mã thì không gửi / lấy ảnh được. Nhiều người cùng mạng không bị lẫn ảnh vì link iPhone chứa IP của đúng máy mình.
- Mã lưu ở `%LOCALAPPDATA%\TicketWriter\phone-upload-token.txt`, **ngoài** folder này: nén folder gửi đồng nghiệp không mang mã theo, máy họ tự tạo mã riêng.
- Muốn đổi mã (vd lỡ để người khác thấy link): xóa file trên rồi chạy lại `.bat`, sau đó dán link mới vào Ticket Writer và mở link mới trên iPhone.
- Không chạy được:
  - Wi-Fi khách / Wi-Fi công cộng thường chặn các máy nói chuyện với nhau → dùng Wi-Fi nội bộ.
  - IP máy tính đổi (đổi mạng, khởi động lại router) → link trên iPhone hết đúng, mở lại theo link mới trong cửa sổ đen.
  - Màn hình đang mở không có ô dán ảnh (vd SMS Shipping) → ảnh chờ trong cửa sổ đen, chuyển sang ticket là ảnh vào.
- Port mặc định `8765`. Bị trùng thì sửa dòng `param([int]$Port = 8765 ...)` trong `phone-upload.ps1` rồi dán lại link mới vào Ticket Writer.
