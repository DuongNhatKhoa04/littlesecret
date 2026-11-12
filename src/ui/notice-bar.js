// src/ui/notice-bar.js — Thanh cảnh báo dưới header: mỗi cảnh báo 1 dòng, có × để ẩn.
(function (TW) {
  'use strict';

  const { el, button } = TW.ui.dom;

  function createNoticeBar({ root, notices }) {
    function render() {
      const items = notices.list();
      root.textContent = '';
      root.hidden = !items.length;
      items.forEach(({ id, level, text }) => {
        const row = el('div', 'notice notice-' + level);
        row.setAttribute('role', level === 'error' ? 'alert' : 'status');
        row.dataset.notice = id;
        row.append(el('span', 'notice-text', text), button('notice-close', '×', { title: 'Ẩn cảnh báo', ariaLabel: 'Ẩn cảnh báo', onClick: () => notices.dismiss(id) }));
        root.append(row);
      });
    }

    notices.subscribe(render);
    return { render };
  }

  TW.ui.noticeBar = { createNoticeBar };
})(window.TW);
