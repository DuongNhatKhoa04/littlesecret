// src/ui/fill-dialog.js — Hộp hướng dẫn cài bookmark "Điền ticket" (kéo lên thanh bookmark) và cách dùng.
(function (TW) {
  'use strict';

  const { $ } = TW.ui.dom;

  function createFillDialog({ ticketFill }) {
    const dialog = $('#fillDlg');
    const link = $('#fillBookmarklet');
    link.href = ticketFill.bookmarkletUrl();
    // Chỉ để kéo; bấm ở đây thì nó chạy trên chính Ticket Writer, không có ô nào để điền
    link.addEventListener('click', (event) => event.preventDefault());
    $('#fillHelp').addEventListener('click', () => dialog.showModal());
    $('#fillClose').addEventListener('click', () => dialog.close());
  }

  TW.ui.fillDialog = { createFillDialog };
})(window.TW);
