# Báo cáo dự án Ticket Writer

23/11/2026 · Ryan Duong (Technical Support Executive)

> Bản nháp, xuất từ [bản Docs](https://claude.ai/artifact/JzjKv5yrTF27CyK3SJYa8B). Số có chữ "ước" và ô "Cần ước / Cần xác nhận" cần chỉnh theo thực tế.

## Kết luận

**Đề xuất cho team support dùng Ticket Writer chính thức, bắt đầu bằng 2 tuần pilot.** Tool đã chạy ổn định ở bản `v2026-11-17.6`, 143/143 test đạt, không tốn tiền license hay server.

Tool giúp ticket đồng nhất format, giảm thời gian gõ lặp lại và gom ảnh bằng chứng trong 1 chỗ. Chi phí chính là thời gian bảo trì của 1 người và thời gian duyệt mỗi bản mới.

Rủi ro cần quản lý: dữ liệu merchant lưu trên từng máy, và tính năng nhận ảnh iPad mở port mạng nên **giữ tắt cho tới khi IT duyệt**.

## Tình hình

**Tool đã làm xong phần viết ticket và SMS, đang dùng thử trong nhóm; phần Setup / Training và nhận ảnh iPad đang tạm ẩn.**

Bài toán: support viết ticket bằng tay nên mỗi người một kiểu, dễ quên bước, thiếu ảnh bằng chứng. Tin SMS, tin chuyển case cũng gõ lại mỗi lần.

| Hạng mục | Hiện trạng |
| --- | --- |
| Viết ticket (Hỗ trợ merchant) | Đang dùng. Nhập theo mục → ra Title + Nội dung chuẩn, nút Copy khóa khi thiếu trường; bookmark *Điền ticket* điền thẳng vào trang ticket |
| Chuyển case | Đang dùng. Form theo team Sales / MKT / CS / Tech, tự tag lead theo ca |
| SMS | Đang dùng. Promotion, báo Shipping, xin Review theo mẫu |
| Ảnh bằng chứng | Đang dùng. Dán / kéo thả / chụp màn hình, đổi thứ tự, tải ZIP / PDF; F5 không mất ảnh |
| Ticket offline | Đang dùng. Lưu ra file khi ticket system không vào được |
| Setup / Training thiết bị | Tạm ẩn. Có checklist PAX, Valor, POS ABC; chờ người phụ trách xác nhận nội dung |
| Nhận ảnh iPad / iPhone | Tạm ẩn. Nhóm đang dùng Send Anywhere; cần IT duyệt mở port |

Về kỹ thuật: bản hiện tại `v2026-11-17.6`, 39 commit từ 01/11 đến 17/11/2026, 143/143 test tự động đạt (kiểm lại ngày 23/11). Output ticket được so từng ký tự với bản gốc `v2026-10-16.1`. Tool chạy bằng cách double-click `index.html` trên Chrome / Edge, không cần cài đặt, không cần Internet.

## Đề xuất

**Triển khai theo 3 bước, mở rộng tính năng chỉ khi bước trước đạt.**

1. **Pilot 2 tuần** với phần đang dùng (Viết ticket, Chuyển case, SMS, Ảnh, Ticket offline).
    - Chọn 3–5 bạn support dùng hàng ngày.
    - Ghi lại: số ticket viết bằng tool, ticket bị trả về vì sai / thiếu, lỗi gặp phải.
2. **Triển khai cho cả team** nếu pilot không có lỗi làm sai nội dung ticket.
    - Phát hành theo checklist [REVIEW.md](REVIEW.md): test xanh, có người duyệt, ghi CHANGELOG.
    - 1 người bảo trì chính + 1 người duyệt thay đổi.
3. **Bật dần phần đang ẩn**, mỗi phần có điều kiện riêng:
    - Setup / Training: sau khi người phụ trách xác nhận câu chữ checklist.
    - Nhận ảnh iPad: chỉ khi IT đồng ý mở port trên máy công ty; nếu không, tiếp tục dùng Send Anywhere.

## Lợi ích

**Lợi ích lớn nhất là ticket đồng nhất và đủ thông tin ngay lần đầu, kế đến là bớt thời gian gõ lặp lại.**

| Lợi ích | Có được nhờ | Đo bằng gì trong pilot |
| --- | --- | --- |
| Ticket đồng nhất format | Title + Nội dung do tool ghép theo 1 chuẩn | Số ticket bị trả về / hỏi lại vì sai format |
| Không thiếu thông tin | Nút Copy khóa khi thiếu trường bắt buộc | Số ticket thiếu thông tin |
| Bớt thời gian | Gợi ý Loại / Tóm tắt, template, tin SMS và chuyển case theo mẫu, bookmark điền ticket | Phút / ticket trước và sau |
| Ảnh bằng chứng gọn | Ảnh gắn theo từng mục, tải ZIP / PDF, không mất khi F5 | Số ticket thiếu ảnh |
| Làm việc khi ticket system lỗi | Ticket offline lưu ra file, mở lại sau | Số lần dùng khi hệ thống sập |
| Bạn mới làm quen nhanh | Form hướng dẫn từng mục, câu chữ chuẩn sẵn | Thời gian tới khi viết ticket độc lập |

Chưa có số đo thời gian tiết kiệm. Cách ước: (phút tiết kiệm / ticket) × (số ticket / ngày) × (số người), điền số thật sau pilot.

## Chi phí

**Không tốn tiền mua phần mềm hay hạ tầng; chi phí là thời gian người làm.**

| Khoản | Mức | Ghi chú |
| --- | --- | --- |
| License, server, hosting | 0 đ | Chạy trên trình duyệt có sẵn, không thư viện ngoài |
| Phát triển đã bỏ ra | 01/11 – 17/11/2026, 39 commit | Làm song song công việc chính, có dùng AI hỗ trợ viết code |
| Bảo trì | Cần ước: giờ / tuần | Thêm loại ticket, sửa câu chữ SMS / checklist chỉ là sửa file config |
| Duyệt mỗi bản mới | ~15–30 phút / bản (ước) | Đọc diff + checklist REVIEW.md |
| Đào tạo | ~15 phút / người (ước) | Giải nén folder, double-click `index.html`, kéo bookmark |
| Công cụ AI (nếu tiếp tục dùng) | Cần xác nhận | Không bắt buộc để bảo trì |

Số có chữ "ước" là giả định, cần chỉnh theo thực tế.

## Side impact & rủi ro

**Rủi ro đáng chú ý nhất là dữ liệu merchant nằm rải rác trên từng máy; các rủi ro còn lại đã có cách giảm.**

| Rủi ro / tác động phụ | Mức | Cách giảm |
| --- | --- | --- |
| Dữ liệu merchant (tên, phone, ảnh màn hình) lưu trong trình duyệt và thư mục Downloads của từng máy | Trung bình | Bấm `Ticket mới` khi xong; xóa file ZIP / PDF / offline sau khi dùng; không mở file HTML lạ cùng profile Chrome |
| Nhận ảnh iPad mở port 8765 qua HTTP không mã hóa | Cao nếu bật | Đang tắt; chỉ bật khi IT duyệt, chỉ trên Wi-Fi nội bộ |
| Trang ticket system đổi giao diện → bookmark *Điền ticket* không điền | Thấp | Bookmark không điền gì khi thiếu ô, nên không điền nhầm; vẫn copy tay được |
| Phụ thuộc 1 người bảo trì | Trung bình | Có sẵn ONBOARDING, REQUIREMENTS, CONFIG, sơ đồ kiến trúc; cử thêm 1 người duyệt |
| Người dùng mở bản cũ, không biết có bản mới | Thấp | Version hiện cạnh tên app; báo bản mới kèm CHANGELOG |
| Thay đổi do AI viết có thể sửa ngoài yêu cầu | Trung bình | Bắt buộc người đọc diff trước khi phát hành (REVIEW.md §3) |
| Thói quen cũ: một số bạn vẫn viết tay | Thấp | Pilot trước, lấy góp ý để chỉnh form |

Tác động phụ tích cực: tool không gửi dữ liệu ra Internet, không cài đặt gì, nên không đụng tới hệ thống ticket hay máy chủ công ty.

## Đề nghị phê duyệt

**Cần quản lý duyệt 4 việc để bắt đầu pilot.**

- [ ] Đồng ý chạy pilot 2 tuần và chọn 3–5 người tham gia
- [ ] Chỉ định người bảo trì chính và người duyệt thay đổi
- [ ] Giao người phụ trách xác nhận câu chữ checklist Setup / Training
- [ ] Gửi IT câu hỏi có cho mở port nhận ảnh iPad hay không

Câu hỏi mở: số ticket / ngày của team và thời gian viết 1 ticket hiện tại, để tính thời gian tiết kiệm sau pilot.
