// config/sms/promotion.js — SMS Promotion: tin nhắn gửi tiệm xác nhận trước khi chạy SMS promotion.
(function (registry) {
  'use strict';

  const { setSms } = registry;

  setSms({
    prices: ['0.02', '0.04', '0.06', '0.08'],   // giá mỗi SMS ($), chỉ chọn trong danh sách này; giá đầu là mặc định

    // Type Customer (chọn nhiều). {tên} = ô số sửa được trên form, `values` = số mặc định.
    // id lưu trong state => không đổi id đang có.
    customerTypes: [
      { id: 'lastVisit',  text: 'Last Visit <= {days}',              values: { days: '365' } },
      { id: 'lastVisitAtLeast', text: 'Last Visit >= {days}',        values: { days: '90' } },
      { id: 'visitTimes', text: 'Times visit between {min} - {max}', values: { min: '1', max: '10000' } }
    ],

    labels: {
      language: 'Ngôn ngữ tin nhắn', shop: 'Tên tiệm', recipients: 'Recipients', customerTypes: 'Type Customer', message: 'Message',
      price: 'Price per SMS ($)'
    },

    // Ngôn ngữ tin nhắn, ngôn ngữ đầu là mặc định. id lưu trong state => không đổi id đang có.
    // lines: từng dòng của tin nhắn. {shop} {recipients} {price} lấy từ form, {total} = giá × Recipients.
    // customerTypes: câu Type Customer theo ngôn ngữ (cùng {tên} như trên); thiếu id nào thì in `text` ở trên.
    languages: [
      {
        id: 'en', label: 'English',
        lines: {
          greeting: 'Hi {shop},',
          intro: 'Please confirm the details below before we send your SMS promotion:',
          recipients: 'Recipients: {recipients} customers',
          customerTypes: 'Type Customer:',
          message: 'Message:',
          price: 'Price per SMS: ${price}',
          total: 'Estimate Total: ${total}',
          outro: 'Please carefully review the content of the Promotion message, and only when you are sure that there are no further changes should you text "OK" to this phone number. Have a nice day.'
        }
      },
      {
        id: 'vi', label: 'Tiếng Việt',
        lines: {
          greeting: 'Chào {shop},',
          intro: 'Anh/chị vui lòng xác nhận thông tin dưới đây trước khi bên em gửi SMS promotion:',
          recipients: 'Số khách nhận: {recipients} khách',
          customerTypes: 'Nhóm khách:',
          message: 'Nội dung tin nhắn:',
          price: 'Giá mỗi SMS: ${price}',
          total: 'Tổng chi phí dự kiến: ${total}',
          outro: 'Anh/chị vui lòng xem kỹ nội dung tin nhắn Promotion, khi chắc chắn không cần chỉnh sửa gì thêm thì nhắn "OK" về số điện thoại này. Chúc anh/chị một ngày tốt lành.'
        },
        customerTypes: {
          lastVisit: 'Lần ghé gần nhất <= {days} ngày',
          lastVisitAtLeast: 'Lần ghé gần nhất >= {days} ngày',
          visitTimes: 'Số lần ghé từ {min} - {max}'
        }
      }
    ]
  });
})(window.TW.registry);
