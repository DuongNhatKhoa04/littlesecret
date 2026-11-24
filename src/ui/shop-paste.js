// src/ui/shop-paste.js — Nút "Dán thông tin tiệm" ở Chuyển case: điền Link Lead / Tên tiệm / MID / ZIP do bookmark "Lấy thông tin tiệm" copy.
(function (TW) {
  'use strict';

  const { el, button } = TW.ui.dom;
  const STATUS_ID = 'pass_shopStatus';
  const TEXT = {
    button: 'Dán thông tin tiệm',
    help: 'Cài bookmark Lấy thông tin tiệm',
    filled: 'Đã điền: ',
    none: 'Clipboard chưa có thông tin tiệm: mở trang Lead, bấm bookmark Lấy thông tin tiệm trước.',
    blocked: 'Chrome chặn đọc clipboard: bấm Ctrl+V ở trang này.',
    hint: 'hoặc Ctrl+V ở trang này (không cần cho phép)'
  };

  /** idPrefix: tiền tố id ô nhập của form Chuyển case, để đặt lại chữ trong ô sau khi điền (form không dựng lại). */
  function createShopPaste({ context, session, passCaseService, shopGrab, idPrefix }) {
    const fields = context.passCase.fields;
    const showStatus = (text) => { const node = document.getElementById(STATUS_ID); if (node) node.textContent = text; };

    function apply(data) {
      const ids = passCaseService.fillShopInfo(data);
      ids.forEach(id => { const input = document.getElementById(idPrefix + id); if (input) input.value = session.passCase().values[id]; });
      showStatus(ids.length ? TEXT.filled + ids.map(id => fields[id].label).join(', ') : TEXT.none);
    }

    async function pasteFromClipboard() {
      const result = await shopGrab.read();
      if (result.status === 'ok') apply(result.data);
      else showStatus(TEXT[result.status]);
    }

    // Ticket Writer chạy file:// nên Chrome có thể hỏi quyền đọc clipboard mỗi lần bấm nút; Ctrl+V không bao giờ hỏi.
    // Ctrl+V ở bất kỳ đâu trên trang Chuyển case: chữ của bookmark thì điền như bấm nút, không dán thô vào ô đang đứng.
    document.addEventListener('paste', (event) => {
      if (!session.isPassCase() || !event.clipboardData) return;
      const data = shopGrab.parse(event.clipboardData.getData('text/plain'));
      if (!data) return;
      event.preventDefault();
      apply(data);
    });

    function node() {
      const wrap = el('div', 'pass-shop');
      const status = el('span', 'status', TEXT.hint);
      status.id = STATUS_ID;
      wrap.append(
        button('ghost', TEXT.button, { onClick: pasteFromClipboard }),
        button('ghost', '?', { ariaLabel: TEXT.help, onClick: () => document.getElementById('fillDlg').showModal() }),
        status);
      return wrap;
    }

    return { node };
  }

  TW.ui.shopPaste = { createShopPaste };
})(window.TW);
