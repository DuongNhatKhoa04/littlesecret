// src/ui/header.js — Header: version, chế độ xem (Alt+M), đổi bên, Ticket mới (ở nhóm SMS: chỉ xóa form SMS đang mở).
(function (TW) {
  'use strict';

  const { $, $$ } = TW.ui.dom;
  const SMS_IMAGE_KEY = TW.domain.sms.IMAGE_KEY;
  const NARROW_QUERY = '(max-width: 799px)';

  function createHeader({ context, session, viewService, ticketService, smsService, shippingService, images, onShowOutput }) {
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

    function reset() {
      if (session.isPromotion()) {
        if (!confirm('Xóa toàn bộ nội dung SMS?')) return;
        images.clear(SMS_IMAGE_KEY);
        smsService.reset();
        return;
      }
      if (session.isShipping()) {
        if (confirm('Xóa toàn bộ nội dung SMS Shipping?')) shippingService.reset();
        return;
      }
      if (!confirm('Xóa toàn bộ nội dung ticket?')) return;
      images.clear();
      ticketService.reset();
    }

    $('#ver').textContent = context.app.version;
    $('#modeSeg').addEventListener('click', (event) => {
      const target = event.target.closest('button');
      if (target) viewService.setMode(target.dataset.mode);
    });
    $('#swapBtn').addEventListener('click', viewService.toggleSwap);
    $('#resetBtn').addEventListener('click', reset);
    document.addEventListener('keydown', (event) => {
      if (event.altKey && !event.ctrlKey && !event.metaKey && event.key.toLowerCase() === 'm') {
        event.preventDefault();
        viewService.cycleMode(narrow.matches);
      }
    });
    narrow.addEventListener('change', render);

    return { render };
  }

  TW.ui.header = { createHeader };
})(window.TW);
