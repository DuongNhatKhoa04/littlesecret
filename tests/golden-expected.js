// tests/golden-expected.js — SINH TỰ ĐỘNG từ ../ticket-writer.html bằng tests/tools/generate_golden.py. Không sửa tay.
(function (TW) {
  'use strict';
  TW.tests.goldenExpected = [
    {
      "name": "incident đủ mục, Workaround, ý nhiều dòng",
      "title": "ABC - CLOVER - MẤT KẾT NỐI",
      "body": "Phone: 0901234567\n\nHiện trạng:\n- Terminal không kết nối được\n  Từ sáng nay\n\nTroubleshoot:\n- Restart router\n- Đổi dây LAN\n\nNguyên nhân phát hiện:\n- Router lỗi\n\nKết luận: Workaround applied\n\nHướng khắc phục đề xuất:\n- Thay router mới\n\nNote:\n- Gọi lại sau 2h",
      "missingAction": false,
      "missingImgs": 0
    },
    {
      "name": "incident Not resolved bước đầu (Phone + Hiện trạng)",
      "title": "PAX - KHÔNG IN ĐƯỢC",
      "body": "Phone: 123\n\nHiện trạng:\n- Máy in không ra giấy\n\nNote:\n- note",
      "missingAction": false,
      "missingImgs": 0
    },
    {
      "name": "incident Not resolved đã troubleshoot, thiếu đề xuất",
      "title": "LỖI",
      "body": "Hiện trạng:\n- A\n\nTroubleshoot:\n- B",
      "missingAction": true,
      "missingImgs": 0
    },
    {
      "name": "incident Resolved, không phone",
      "title": "INTERNET - WIFI CHẬP CHỜN",
      "body": "Hiện trạng:\n- Wifi rớt\n\nTroubleshoot:\n- Đổi kênh\n\nNguyên nhân phát hiện:\n- Nhiễu sóng",
      "missingAction": false,
      "missingImgs": 0
    },
    {
      "name": "request Workaround thiếu hành động đề xuất",
      "title": "ABC - ĐỔI GIÁ",
      "body": "Phone: 555\n\nYêu cầu:\n- Đổi giá dịch vụ\n\nAction:\n- Đã đổi 1 phần\n\nKết luận: Workaround applied",
      "missingAction": true,
      "missingImgs": 0
    },
    {
      "name": "request Resolved đủ",
      "title": "ABC - INTERNET - THÊM NHÂN VIÊN",
      "body": "Phone: 777\n\nYêu cầu:\n- Thêm 2 nhân viên\n\nAction:\n- Đã thêm\n\nHành động đề xuất:\n- x\n\nNote:\n- Line 1\n  Line 2",
      "missingAction": false,
      "missingImgs": 0
    },
    {
      "name": "transfer có phone + VIE",
      "title": "CLOVER - HỎI MARKETING",
      "body": "Phone: 0909 - VIE\n\nYêu cầu:\n- Merchant muốn chạy quảng cáo\n\nNhờ team help merchant ạ. Many thanks team!",
      "missingAction": false,
      "missingImgs": 0
    },
    {
      "name": "transfer rỗng",
      "title": "",
      "body": "",
      "missingAction": false,
      "missingImgs": 0
    },
    {
      "name": "title chỉ có Loại, dấu - thừa cuối",
      "title": "ABC - ",
      "body": "",
      "missingAction": false,
      "missingImgs": 0
    },
    {
      "name": "setup POS: tick, N/A, thiếu ảnh, Firewall có cha",
      "title": "ABC - SETUP TIỆM MỚI",
      "body": "Phone: 111\n\nSetup Router (nếu có):\n- [x] Connect LAN modem tiệm → WAN Router mình cấp\n- [x] Connect POS vào router: Ethernet hoặc WiFi\n\nSetup Macdesk (nếu chưa có thì làm ngay sau khi connect):\n- [N/A] Cài Macdesk Client và chọn Install sau khi đã cài để có quyền cao nhất. Cần đảm bảo User POS đang là Administrator.\n- [ ] Xóa các phần mềm remote khác\n\nSetup terminal:\n- [ ] Setup terminal\n\nSetup máy POS (làm theo thứ tự):\n- [ ] Check Version Window + Chip\n- [x] Check Services BitLocker + Window Update\n- [ ] Check Date & time\n- [ ] Download Java 321\n- [ ] Xóa OneDrive cũ, tải OneDrive mới và cài lại\n- [x] Check Firewall – Advanced Inbound\n- [ ] Check Firewall – Advanced Outbound\n- [ ] Check Firewall – Allow App JAVA private public\n- [ ] Check Control Panel\n- [ ] Sync data từ ondrive về\n- [ ] Tải systemm_exe250925.exe\n- [ ] Tải font cho All users\n- [ ] Extract rồi chạy !RUNTHISFIRST\n- [ ] Cần connect máy in, có giấy mới ở được cash drawer\n\nCheck ABC:\n- [ ] Check License\n- [ ] Check Shop info\n- [ ] Điền link booking lên lead\n- [ ] Check Connection với Terminal\n- [ ] Check Printer / Scan QR / Cashier\n- [ ] Check CD\n- [ ] Nếu là PAX cần check Authorize Payment trong Terminal\n- [ ] Xin menu + Setup Menu cho tiệm\n\nChụp checklist:\n- [ ] Chụp checklist\n\nNote:\n- Tiệm đóng cửa 8pm",
      "missingAction": false,
      "missingImgs": 22
    },
    {
      "name": "setupPax: mọi mục N/A",
      "title": "PAX - A920",
      "body": "Cần setup:\n- [N/A] Check QC note\n- [N/A] Check MID\n- [N/A] Check Connection trong ECR của application và Connect internet\n- [N/A] Check CD/Surcharge\n- [N/A] Check SN trong PAX Store\n- [N/A] Close Batch trong Settle\n- [N/A] Tắt Demo Mode\n- [N/A] Check Time Zone\n- [N/A] Check Display / Screen\n- [N/A] Mở Auto Reboot time trong Security Settings\n- [N/A] Sleep → Never\n- [N/A] Test Sale",
      "missingAction": false,
      "missingImgs": 0
    },
    {
      "name": "setupPax: chưa đụng gì, chỉ phone",
      "title": "",
      "body": "Phone: 222\n\nCần setup:\n- [ ] Check QC note\n- [ ] Check MID\n- [ ] Check Connection trong ECR của application và Connect internet\n- [ ] Check CD/Surcharge\n- [ ] Check SN trong PAX Store\n- [ ] Close Batch trong Settle\n- [ ] Tắt Demo Mode\n- [ ] Check Time Zone\n- [ ] Check Display / Screen\n- [ ] Mở Auto Reboot time trong Security Settings\n- [ ] Sleep → Never\n- [ ] Test Sale",
      "missingAction": false,
      "missingImgs": 7
    },
    {
      "name": "newDb: Pricing có cha, đủ ảnh 1 phần",
      "title": "ABC - DB",
      "body": "Tạo DB trắng cho máy mới:\n- [x] Dùng DB gen để tạo DB trắng\n- [x] Copy → Import menu (nếu có) → tick Clear Database file → Submit\n\nMở ABC, check setup (đè dữ liệu):\n- [ ] Đè shop_email trong Prop\n- [ ] Đè nail_data trong Storage\n- [x] Pricing (trong Setup) – Discount\n- [N/A] Pricing (trong Setup) – Admin\n- [ ] Pricing (trong Setup) – Terminal (Dual Pricing)\n- [ ] Feedback: tắt demo mode\n- [ ] Appointment\n\nTạo OneDrive:\n- [ ] Tạo OneDrive\n- [ ] Tắt Strong VPN sau khi tạo xong\n- [ ] Tải file system_exe lên OneDrive",
      "missingAction": false,
      "missingImgs": 7
    },
    {
      "name": "setupValor replace: đủ ảnh",
      "title": "REPLACE",
      "body": "Phone: 333\n\nReplace thiết bị (thay máy cũ):\n- [x] Connect WiFi cho máy mới\n- [ ] Đóng Batch trên máy cũ\n- [ ] Chụp EPI trong màn hình Batch Settle (trên máy mới)\n- [ ] Test Sale trên máy mới\n- [ ] Đóng Batch trên máy mới sau khi test sale xong",
      "missingAction": false,
      "missingImgs": 0
    },
    {
      "name": "setupTraining: có note, tip N/A",
      "title": "CLOVER - TRAINING",
      "body": "Phone: 444\n\nBước 1: Xác định tiệm và kiểm tra thiết bị:\n- [x] Ghi Tên tiệm + MID vào ticket\n- [ ] Check EPI trên máy\n- [ ] Check SN (Serial Number) trên máy\n- [ ] Check box ship ra\n\nBước 2: Connect WiFi:\n- [ ] Connect WiFi cho máy\n\nBước 3: Test Sale:\n- [ ] Thực hiện 1 giao dịch test\n- [ ] Check thông tin trên receipt\n\nBước 4: Training MC các thao tác sau Sale (trong menu 3 gạch ☰):\n- [ ] Void\n- [ ] Refund\n- [N/A] Adjust Tip\n\nBước 5: Settlement:\n- [ ] Đóng batch (Settlement) sau khi test và training xong\n\nNote:\n- MC hiểu hết",
      "missingAction": false,
      "missingImgs": 4
    }
  ];
})(window.TW);
