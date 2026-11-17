// config/tickets/transfer.js — Viết ticket: Chuyển case cho team Sales / MKT / CS / Tech.
(function (registry) {
  'use strict';

  const { addTicket } = registry;

  addTicket('transfer', {
    label: 'Chuyển case', tag: 'Transfer',
    passCase: true,   // form + tin nhắn group riêng (config/tickets/pass-case.js) thay cho form ticket
    // Các trường dưới là form ticket cũ: không còn hiện, giữ để template cũ vẫn mở được và test golden so với bản gốc.
    showLang: true,                                          // thêm "- ENG/VIE" sau số Phone
    noCategory: true,                                        // không có ô Loại, title chỉ có Tóm tắt
    footer: 'Nhờ team help merchant ạ. Many thanks team!',   // câu cố định cuối ticket
    sections: [
      { key: 's1', label: 'Yêu cầu', ph: 'Merchant cần được hỗ trợ gì…' }
    ]
  });
})(window.TW.registry);
