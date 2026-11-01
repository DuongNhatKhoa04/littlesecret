// config/setup/terminal/pax/new/setup.js — Terminal PAX · Ship mới.
(function (registry) {
  'use strict';

  const { addSetup, NOTE } = registry;

  // Mục có ảnh = bắt buộc 1 ảnh (hoặc N/A). Mục noImage chỉ cần tick.
  addSetup('setupPax', {
    label: 'Setup PAX', tag: 'Setup PAX',
    meta: { device: 'terminal', brand: 'pax', flow: 'new', models: [], order: 1 },
    sections: [NOTE],
    checklist: {
      title: 'Setup PAX (A920 / A920 Pro / A3700)', requireImages: true,
      groups: [
        { title: 'Cần setup', items: [
          { id: 'pax-qc',      noImage: true, text: 'Check QC note',
            warn: 'Nếu note ghi Error thì phải đưa lại cho team build máy xử lý trước, không tiếp tục setup' },
          { id: 'pax-mid',     text: 'Check MID',
            sub: ['Xác nhận đúng Merchant ID đã gán cho terminal (Host Settings)', 'Chụp ảnh Host Settings'] },
          { id: 'pax-conn',    text: 'Check Connection trong ECR của application và Connect internet',
            sub: ['Xác nhận terminal kết nối mạng ổn định (WiFi/Ethernet)', 'Cần đảm bảo dùng USB hay internet trước khi connect internet'] },
          { id: 'pax-cd',      noImage: true, text: 'Check CD/Surcharge',
            sub: ['Xác nhận cấu hình Cash Discount/Surcharge đúng theo merchant'] },
          { id: 'pax-sn',      text: 'Check SN trong PAX Store',
            sub: ['Serial Number phải hiện icon xanh lá (xác nhận thiết bị đã active đúng)', 'Chụp ảnh SN terminal, khớp icon xanh lá trong PAX Store'] },
          { id: 'pax-close',   text: 'Close Batch trong Settle',
            sub: ['Vào Settle, chọn mục 2 (only)', 'Chụp ảnh xác nhận đã đóng batch'],
            warn: 'Đây là lần 1: trước khi charge (nếu tiệm có máy cũ dùng song song). Lần 2 là bước cuối "Close batch sau khi test sale"' },
          { id: 'pax-demo',    noImage: true, text: 'Tắt Demo Mode',
            sub: ['Đảm bảo terminal ở chế độ giao dịch thật, không còn demo (Operation Setting)'] },
          { id: 'pax-tz',      text: 'Check Time Zone',
            sub: ['Vào System, xác nhận đúng múi giờ theo địa điểm tiệm và tắt 2 mục auto', 'Chụp ảnh cấu hình múi giờ đã set đúng'] },
          { id: 'pax-display', noImage: true, text: 'Check Display / Screen',
            sub: ['When to Start → Never'] },
          { id: 'pax-reboot',  noImage: true, text: 'Mở Auto Reboot time trong Security Settings',
            sub: ['Bật lịch tự khởi động lại định kỳ cho terminal'] },
          { id: 'pax-sleep',   noImage: true, text: 'Sleep → Never',
            sub: ['Tắt chế độ sleep, đảm bảo terminal luôn sẵn sàng nhận giao dịch'] },
          { id: 'pax-sale',    text: 'Test Sale',
            sub: ['Chụp ảnh kết quả giao dịch test thành công'] },
          { id: 'pax-close-after', noImage: true, text: 'Close batch sau khi test sale',
            sub: ['Để giao dịch test không lẫn vào batch thật đầu tiên của merchant'] }
        ] }
      ]
    }
  });
})(window.TW.registry);
