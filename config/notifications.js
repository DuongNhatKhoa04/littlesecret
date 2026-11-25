// config/notifications.js — Danh sách cảnh báo hiện ở thanh dưới header (không chặn thao tác như hộp alert).
// Mỗi cảnh báo tự hiện khi gặp sự cố, tự ẩn khi hết sự cố. Người dùng bấm × thì ẩn tới lần sự cố sau.
// Sửa câu chữ / ngưỡng ở đây. id do code dùng => KHÔNG ĐỔI id, chỉ đổi level / message.
(function (registry) {
  'use strict';

  const { setNotifications } = registry;

  setNotifications({
    nearlyFullRatio: 0.8,   // dung lượng trình duyệt cho phép đã dùng >= 80% => cảnh báo sắp đầy

    // level: 'error' (đỏ, đang mất dữ liệu khi tải lại trang) · 'warn' (vàng, cần để ý)
    // {percent} trong message = % dung lượng đã dùng
    items: {
      sessionSaveFailed: {
        level: 'error',
        when: 'Ghi ticket đang nhập / form SMS vào localStorage bị lỗi (đầy hoặc bị chặn)',
        message: 'Không lưu được nội dung đang nhập vào trình duyệt (bộ nhớ đầy hoặc bị chặn). Tải lại trang sẽ mất phần đang nhập — dùng Khác → Lưu ticket ra file để giữ lại.'
      },
      imageSaveFailed: {
        level: 'error',
        when: 'Ghi ảnh vào IndexedDB bị lỗi (đầy hoặc bị chặn). Tự ẩn khi mọi mục có ảnh đã lưu lại được, hoặc bấm Ticket mới',
        message: 'Không lưu được ảnh vào trình duyệt (bộ nhớ đầy hoặc bị chặn). Ảnh vẫn dùng được, nhưng tải lại trang sẽ mất — bấm Tải tất cả (ZIP) để giữ ảnh.'
      },
      storageNearlyFull: {
        level: 'warn',
        when: 'Dung lượng trình duyệt cho phép đã dùng >= nearlyFullRatio. Kiểm tra khi mở trang và mỗi lần ảnh thay đổi',
        message: 'Bộ nhớ trình duyệt đã dùng {percent}%. Ticket nào đã xong thì bấm Ticket mới để xóa ảnh cũ, tránh bị đầy.'
      }
    }
  });
})(window.TW.registry);
