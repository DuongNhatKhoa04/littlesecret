# Review & phát hành

Code chạy được chưa chắc đúng yêu cầu. Test bắt được lỗi đã biết; những chỗ dưới đây cần **người đọc diff và quyết định**.

## 1. Vùng bắt buộc có người duyệt

Thay đổi chạm vào các vùng này → người phụ trách đọc diff trước khi commit / gửi đi, kể cả khi test xanh.

| Vùng | File | Vì sao rủi ro | Người duyệt kiểm gì |
|---|---|---|---|
| Định dạng Title / Nội dung ticket | `src/domain/title.js`, `body.js`, `config/tickets/*`, `tests/golden*.js` | Ticket là output chính, nhiều người dán vào hệ thống | Golden test còn xanh; ca nào cố ý đổi đã ghi trong `CHANGED_SINCE_ORIGINAL` và REQUIREMENTS |
| Dữ liệu đã lưu | `config/app.js` (các key), `session-repository.js`, `sanitize…`, `image-store.js` | Sai là người dùng mất ticket đang nhập / template / ảnh | Không đổi key; dữ liệu bản cũ vẫn đọc được (test "đọc state bản cũ") |
| Câu chữ checklist, SMS | `config/setup/**`, `config/sms/*` | Nội dung nghiệp vụ, gửi cho merchant | Đúng chữ người phụ trách đưa, không tự sửa chính tả |
| Bookmark Điền ticket | `config/app.js` → `ticketFill`, `src/infrastructure/ticket-fill.js` | Chạy trên trang ticket system bên ngoài | Thử trên trang ticket thật; nhắc mọi người kéo lại bookmark |
| phone-upload | `phone-upload/*`, `phone-inbox.js`, `phone-service.js` | Mở port mạng trên máy công ty | Đối chiếu [SECURITY.md](SECURITY.md) §3; mã vẫn bắt buộc ở mọi đường dẫn; loopback vẫn được kiểm |
| Bảo mật chung | Mọi chỗ thêm `innerHTML`, `fetch`, thư viện, đọc file / storage | Xem [SECURITY.md](SECURITY.md) §4 | Không vi phạm quy tắc §4 |
| Thay đổi lớn do AI làm | Nhiều file trong 1 lần | Dễ lẫn sửa ngoài yêu cầu, ghi đè sửa của người khác | Xem §3 dưới |

## 2. Checklist trước khi gửi bản mới cho đồng nghiệp

**Tự động**

- [ ] `tests/index.html` (hoặc `python tests/tools/run_tests.py`): `PASS x/x`.
- [ ] `python tests/tools/smoke_ui.py`: mọi dòng `PASS`, không có `JS ERROR`.

**Tay** (chi tiết ở CLAUDE.md → Kiểm tra sau khi sửa)

- [ ] Mở `index.html`, DevTools Console không có lỗi đỏ.
- [ ] Đi qua các loại ticket đang hiện, nhập thử loại vừa sửa: Title / Nội dung đúng, nút Copy khóa / mở đúng.
- [ ] Mở bằng trình duyệt **đang có dữ liệu bản cũ**: ticket đang nhập, template, ảnh vẫn còn.
- [ ] Đổi giao diện (`Sáng` / `Tối`) nhìn qua chỗ vừa sửa.
- [ ] Sửa phone-upload: chạy `.bat` thật, iPad quét QR, gửi 2–3 ảnh, `Đổi mã ngay` rồi thử gửi bằng trang cũ (phải báo hết hạn).

**Giấy tờ**

- [ ] Đã tăng `version` trong `config/app.js`.
- [ ] Đã thêm dòng vào [CHANGELOG.md](../CHANGELOG.md).
- [ ] Đổi hành vi → đã cập nhật [REQUIREMENTS.md](REQUIREMENTS.md) (không đánh số lại mục §).
- [ ] `git status` sạch: không còn file tạm ở thư mục gốc (`_smoke.html`, `_*.html` do test tạo ra nếu bị dừng giữa chừng).

**Gửi đi**

- [ ] Không gửi source: `python tests/tools/build_release.py` rồi `python tests/tools/smoke_ui.py release/ticket-writer.html` xanh → gửi 1 file `release/ticket-writer.html`. Gửi cả source: nén cả folder dự án.
- [ ] Không kèm Downloads, không kèm file ticket offline / ZIP ảnh của merchant.
- [ ] Báo đồng nghiệp: version mới, đổi gì (copy từ CHANGELOG), có phải kéo lại bookmark *Điền ticket* / chạy lại phone-upload không.

## 3. Review thay đổi do AI (Claude) làm

- **Đọc `git diff` trước khi commit**, đừng chỉ đọc tóm tắt của AI. Đặc biệt các file trong §1.
- **Đối chiếu tóm tắt với diff**: AI nói "chỉ sửa X" thì diff chỉ được có X. File lạ trong diff → hỏi lại.
- **Sửa dở của mình có còn không**: nếu đang sửa tay file nào mà chưa commit rồi nhờ AI làm việc khác, kiểm tra file đó còn nguyên. (Đã xảy ra: REQUIREMENTS §21.1 có ghi chú sửa lỗi kết nối dự phòng, nhưng `phone-upload.ps1` được AI viết lại cả file; phải làm lại phần sửa đó.) Commit trước khi giao việc lớn cho AI là cách an toàn nhất.
- **"Đã test" nghĩa là test gì**: AI phải nói rõ ca nào đã chạy, ca nào chưa (vd thử trên iPad thật, chạy tường lửa thật). Ca chưa chạy → người tự thử hoặc ghi vào rủi ro.
- **Tài liệu khớp code**: hành vi mới có trong REQUIREMENTS; quy tắc mới có trong CLAUDE.md; rủi ro mới có trong SECURITY.md.

## 4. Quyết định phát hành

Người phụ trách quyết định gửi hay chưa. Chưa gửi nếu:

- Test / smoke đỏ, hoặc Console có lỗi.
- Có thay đổi ở vùng §1 chưa ai đọc diff.
- Có ca trong checklist §2 bỏ qua mà không ghi lý do.
- Có rủi ro mới (nhất là phone-upload) chưa ghi vào [SECURITY.md](SECURITY.md).
