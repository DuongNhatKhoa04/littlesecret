// src/ui/phone-button.js — Nút Nhận ảnh iOS ở header: bật nhận ảnh iPad / iPhone (qua phone-upload), mở mã QR, hiện trạng thái.
(function (TW) {
  'use strict';

  const { $, flash } = TW.ui.dom;
  const { STATUS } = TW.application.phoneService;

  const VIEWS = {
    off: { label: 'Nhận ảnh iOS', title: 'Chạy phone-upload.bat trước, rồi bấm đây và dán link mục 1 trong cửa sổ đó (chỉ 1 lần)' },
    on: { label: 'Đang nhận ảnh', title: 'Ảnh gửi từ iPad / iPhone tự vào mục đang mở (như Ctrl+V). Bấm để hiện mã QR cho iPad quét' },
    lost: { label: 'Mất kết nối', title: 'Không gọi được phone-upload: cửa sổ phone-upload đã tắt hoặc link sai. Bấm để thử lại' }
  };
  const ASK_LINK = 'Dán link mục 1 trong cửa sổ phone-upload (dạng http://127.0.0.1:8765/…):';
  const INVALID_LINK = 'Link không đúng. Dán link mục 1 (http://127.0.0.1:…) trong cửa sổ phone-upload, không phải link iPad.';
  const RECEIVED = 'Đã nhận ảnh ✓';

  function createPhoneButton({ phoneService, phoneDialog }) {
    const node = $('#phoneBtn');

    function render() {
      const view = VIEWS[phoneService.status()];
      node.textContent = view.label;
      node.dataset.label = view.label;   // flash() trả về đúng chữ của trạng thái mới
      node.dataset.status = phoneService.status();
      node.title = view.title;
    }

    node.addEventListener('click', () => {
      if (phoneService.status() === STATUS.on) { phoneDialog.open(); return; }
      const text = prompt(ASK_LINK, phoneService.link());   // đã có link thì điền sẵn: Enter là thử lại
      if (text === null) return;
      if (phoneService.connect(text)) phoneDialog.open(); else alert(INVALID_LINK);
    });
    phoneService.subscribe((event) => {
      if (event === 'received') flash(node, RECEIVED);
      else render();
    });
    render();
  }

  TW.ui.phoneButton = { createPhoneButton };
})(window.TW);
