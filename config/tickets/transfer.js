// config/tickets/transfer.js — Viết ticket: Chuyển ticket cho team CS / MKT.
(function (registry) {
  'use strict';

  const { addTicket } = registry;

  addTicket('transfer', {
    label: 'Chuyển CS/MKT', tag: 'Transfer',
    showLang: true,                                          // thêm "- ENG/VIE" sau số Phone
    noCategory: true,                                        // không có ô Loại, title chỉ có Tóm tắt
    footer: 'Nhờ team help merchant ạ. Many thanks team!',   // câu cố định cuối ticket
    sections: [
      { key: 's1', label: 'Yêu cầu', ph: 'Merchant cần được hỗ trợ gì…' }
    ]
  });
})(window.TW.registry);
