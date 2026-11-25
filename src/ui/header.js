// src/ui/header.js — Header: version (trong menu Khác), chế độ xem (Alt+M), đổi bên, Ticket mới (Alt+N; ở SMS Shipping / Xin review / Chuyển case: chỉ xóa form đang mở).
(function (TW) {
  'use strict';

  const { $, $$ } = TW.ui.dom;
  const NARROW_QUERY = '(max-width: 799px)';
  const FIRST_FIELD = 'input:not([type="checkbox"]):not([type="file"]):not([hidden]), textarea';

  function createHeader({ context, session, viewService, ticketService, smsService, shippingService, reviewService, passCaseService, images, onShowOutput }) {
    const narrow = window.matchMedia(NARROW_QUERY);
    const main = $('#main');

    function render() {
      const mode = viewService.effectiveMode(narrow.matches);
      main.dataset.mode = mode;
      main.dataset.swap = session.state().swap ? '1' : '0';
      $('#swapBtn').disabled = mode !== 'split';
      $$('#modeSeg button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
      if (mode !== 'input') onShowOutput();
    }

    /** Hỏi xác nhận rồi xóa form đang mở. Trả về false nếu người dùng hủy. */
    function reset() {
      if (session.isShipping()) return confirmed('Xóa toàn bộ nội dung SMS Shipping?', shippingService.reset);
      if (session.isReview()) return confirmed('Xóa toàn bộ nội dung SMS Xin review?', reviewService.reset);
      if (session.isPassCase()) return confirmed('Xóa toàn bộ nội dung Chuyển case?', passCaseService.reset);
      return confirmed('Xóa toàn bộ nội dung ticket?', () => {
        images.clear();
        smsService.reset();
        ticketService.reset();
      });
    }

    function confirmed(question, clear) {
      if (!confirm(question)) return false;
      clear();
      return true;
    }

    /** Alt+N: Ticket mới không cần chuột; xóa xong (form dựng lại) thì con trỏ vào ô nhập đầu tiên để gõ ngay. */
    function resetFromKeyboard() {
      if (!reset()) return;
      requestAnimationFrame(() => {
        const first = $('#form').querySelector(FIRST_FIELD);
        if (first) first.focus();
      });
    }

    $('#ver').textContent = context.app.version;
    $('#modeSeg').addEventListener('click', (event) => {
      const target = event.target.closest('button');
      if (target) viewService.setMode(target.dataset.mode);
    });
    $('#swapBtn').addEventListener('click', viewService.toggleSwap);
    // Mục trong menu Khác tự chạy việc của nó (listener riêng); menu chỉ cần đóng lại sau khi bấm.
    // Trừ ô chọn màu: menu mở tiếp để xem và so các màu.
    $('#moreMenu').addEventListener('click', (event) => { if (event.target.closest('button:not(.swatch)')) $('#moreMenu').hidePopover(); });
    $('#resetBtn').addEventListener('click', reset);
    const SHORTCUTS = { m: () => viewService.cycleMode(narrow.matches), n: resetFromKeyboard };
    document.addEventListener('keydown', (event) => {
      const run = event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey && SHORTCUTS[event.key.toLowerCase()];
      if (!run) return;
      event.preventDefault();
      run();
    });
    narrow.addEventListener('change', render);

    return { render };
  }

  TW.ui.header = { createHeader };
})(window.TW);
