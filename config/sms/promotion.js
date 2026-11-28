// config/sms/promotion.js — SMS Promotion: tin nhắn gửi tiệm xác nhận trước khi chạy SMS promotion.
(function (registry) {
  'use strict';

  const { setSms } = registry;

  setSms({
    // Price per SMS tự chọn theo số segment của tin khách nhận: segmentPrice × segment (1 = 0.02, 2 = 0.04, 3 = 0.06, 4 = 0.08, 5 = 0.10…).
    // Tin dài hơn maxSegments thì cảnh báo nên rút ngắn (vẫn tính tiếp).
    segmentPrice: '0.02',
    maxSegments: 4,

    // Type Customer (chọn nhiều). {tên} = ô số sửa được trên form, `values` = số mặc định.
    // id lưu trong state => không đổi id đang có.
    customerTypes: [
      { id: 'lastVisit',  text: 'Last Visit <= {days}',              values: { days: '365' } },
      { id: 'lastVisitAtLeast', text: 'Last Visit >= {days}',        values: { days: '90' } },
      { id: 'visitTimes', text: 'Times visit between {min} - {max}', values: { min: '1', max: '10000' } },
      { id: 'all',        text: 'All customers',                               values: {} }
    ],

    labels: {
      toggle: 'SMS Promotion', language: 'Ngôn ngữ tin nhắn', shop: 'Tên tiệm', shopPhone: 'Phone tiệm', recipients: 'Recipients', customerTypes: 'Type Customer', message: 'Message',
      price: 'Price per SMS ($)',
      priceAuto: '${price} · tự chọn theo {segments} segment × ${segmentPrice}',   // dòng thay cho ô chọn giá
      priceTooLong: ' · tin dài hơn {max} segment, nên rút ngắn Message',
      // Dòng nhỏ dưới ô Message: đếm trên tin khách nhận (cả tên tiệm, phone, Reply STOP). {units} = ký tự tính theo SMS.
      segmentInfo: '{units} ký tự · {segments} segment · {encoding}',
      segmentUnsupported: ' · thành UCS-2 (70 ký tự/segment) vì: {chars}'
    },

    // Tin khách nhận, in trong ngoặc kép dưới dòng Message, giống nhau ở mọi ngôn ngữ. {shop} {shopPhone} {message} lấy từ form.
    promoText: '{shop} {shopPhone}. {message} Reply STOP To Optout',

    // key mục của loại ticket có smsPromotion: khối SMS đang bật thì chi tiết Recipients → hết Message (không có giá) in thêm cuối mục này
    ticketSection: 's2',

    // Ngôn ngữ tin nhắn, ngôn ngữ đầu là mặc định. id lưu trong state => không đổi id đang có.
    // lines: từng dòng của tin nhắn. {recipients} lấy từ form, {price} = segmentPrice × số segment của tin khách nhận (đếm như Twilio),
    //   {total} = {price} × Recipients.
    // customerTypes: câu Type Customer theo ngôn ngữ (cùng {tên} như trên); thiếu id nào thì in `text` ở trên.
    languages: [
      {
        id: 'en', label: 'English',
        lines: {
          greeting: 'Greeting,',
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
          greeting: 'Xin chào,',
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
          visitTimes: 'Số lần ghé từ {min} - {max}',
          all: 'Tất cả'
        }
      }
    ]
  });
})(window.TW.registry);
