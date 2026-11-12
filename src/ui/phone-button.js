// src/ui/phone-button.js — Nút Nhận ảnh iOS ở header: bật / tắt nhận ảnh từ iPhone / iPad (qua phone-upload), hiện trạng thái.
(function (TW) {
  'use strict';

  const { $, flash } = TW.ui.dom;
  const { STATUS } = TW.application.phoneService;

  const VIEWS = {
    off: { label: 'Nhận ảnh iOS', title: 'Chạy phone-upload.bat trước, rồi bấm đây và dán link hiện trong cửa sổ đó' },
    on: { label: 'Đang nhận ảnh', title: 'Ảnh gửi từ iPhone / iPad tự vào mục đang mở (như Ctrl+V). Bấm để tắt' },
    lost: { label: 'Mất kết nối', title: 'Không gọi được phone-upload: cửa sổ phone-upload đã tắt hoặc link sai. Bấm để thử lại' }
  };
  const ASK_LINK = 'Dán link hiện trong cửa sổ phone-upload (dạng http://…:8765/…):';
  const INVALID_LINK = 'Link không đúng. Copy link trong cửa sổ phone-upload rồi dán lại.';
  const RECEIVED = 'Đã nhận ảnh ✓';

  function createPhoneButton({ phoneService }) {
    const node = $('#phoneBtn');

    function render() {
      const view = VIEWS[phoneService.status()];
      node.textContent = view.label;
      node.dataset.label = view.label;   // flash() trả về đúng chữ của trạng thái mới
      node.dataset.status = phoneService.status();
      node.title = view.title;
    }

    node.addEventListener('click', () => {
      if (phoneService.status() === STATUS.on) { phoneService.stop(); return; }
      const text = prompt(ASK_LINK, phoneService.link());   // đã có link thì điền sẵn: Enter là thử lại
      if (text !== null && !phoneService.connect(text)) alert(INVALID_LINK);
    });
    phoneService.subscribe((event) => {
      if (event === 'received') flash(node, RECEIVED);
      else render();
    });
    render();
  }

  TW.ui.phoneButton = { createPhoneButton };
})(window.TW);
