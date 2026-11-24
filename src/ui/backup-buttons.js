// src/ui/backup-buttons.js — Nút "Sao lưu" (tải file gợi ý Tóm tắt, gợi ý tag, template) và "Khôi phục" (chọn file đó ở máy mới, ghi đè rồi tải lại trang).
(function (TW) {
  'use strict';

  const { $, flash } = TW.ui.dom;

  const RESTORE_CONFIRM = 'Gợi ý Tóm tắt, gợi ý tên người support thêm (Chuyển case) và template trong file sao lưu ' +
    'sẽ THAY dữ liệu đó đang có trên máy này. Ticket đang nhập không đổi. Tiếp tục?';
  const INVALID_FILE = 'File không phải file sao lưu của Ticket Writer (chọn file ticket-writer-backup-….json đã tải bằng nút Sao lưu).';
  const WRITE_FAILED = 'Có dữ liệu không ghi được (bộ nhớ trình duyệt đầy hoặc bị chặn). Phần đã ghi vẫn giữ.';

  function createBackupButtons({ backupService }) {
    const picker = $('#backupImport');

    async function restore(file) {
      const result = await backupService.importFile(file);
      if (!result) { alert(INVALID_FILE); return; }
      if (result.failed) alert(WRITE_FAILED);
      location.reload();   // mọi phần đã đọc dữ liệu lúc mở trang => tải lại để dùng dữ liệu mới
    }

    $('#backupSave').addEventListener('click', () => {
      backupService.exportBackup(new Date());
      flash($('#backupSave'), 'Đã tải ✓');
    });
    $('#backupOpen').addEventListener('click', () => { if (confirm(RESTORE_CONFIRM)) picker.click(); });
    picker.addEventListener('change', () => {
      const file = picker.files[0];
      picker.value = '';   // chọn lại cùng file vẫn chạy
      if (file) restore(file);
    });
  }

  TW.ui.backupButtons = { createBackupButtons };
})(window.TW);
