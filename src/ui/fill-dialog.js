// src/ui/fill-dialog.js — Hộp hướng dẫn cài bookmark "Điền ticket" và "Lấy thông tin tiệm" (kéo lên thanh bookmark) và cách dùng.
(function (TW) {
  'use strict';

  const { $ } = TW.ui.dom;

  function createFillDialog({ ticketFill, shopGrab }) {
    const dialog = $('#fillDlg');
    // Chỉ để kéo; bấm ở đây thì nó chạy trên chính Ticket Writer, không có ô nào để điền / để lấy
    [['#fillBookmarklet', ticketFill], ['#shopBookmarklet', shopGrab]].forEach(([selector, source]) => {
      const link = $(selector);
      link.href = source.bookmarkletUrl();
      link.addEventListener('click', (event) => event.preventDefault());
    });
    $('#fillHelp').addEventListener('click', () => dialog.showModal());
    $('#fillClose').addEventListener('click', () => dialog.close());
  }

  TW.ui.fillDialog = { createFillDialog };
})(window.TW);
