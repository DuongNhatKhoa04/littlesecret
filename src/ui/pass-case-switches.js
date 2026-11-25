// src/ui/pass-case-switches.js — Nút chọn nhanh dưới hàng CBN của Chuyển case: CBN / FT (Alt+C), VIE / ENG (Alt+X).
(function (TW) {
  'use strict';

  const { el, segmented } = TW.ui.dom;
  const { findOption } = TW.domain.passCase;

  /** @param {{ context: object, session: object, passCaseService: object }} deps */
  function createPassCaseSwitches({ context, session, passCaseService }) {
    const switches = context.passCase.switches;
    let groups = {};   // id switch -> nhóm nút đang hiện trên form

    /** Đổi option không dựng lại form (giữ con trỏ) => tự cập nhật nút đang chọn. */
    function refresh() {
      Object.entries(groups).forEach(([id, group]) => {
        const selected = findOption(session.passCase(), context.passCase, id).id;
        group.querySelectorAll('button').forEach(node => node.setAttribute('aria-pressed', String(node.dataset.option === selected)));
      });
    }

    function group(id, item) {
      const node = segmented({
        options: item.options, value: findOption(session.passCase(), context.passCase, id).id,
        ariaLabel: `${item.label} (Alt+${item.shortcut.toUpperCase()})`,
        onSelect: (optionId) => { passCaseService.setSwitch(id, optionId); refresh(); }
      });
      node.title = `${item.label}: bấm để chọn, Alt+${item.shortcut.toUpperCase()} để đổi`;
      node.querySelectorAll('button').forEach((button, index) => {
        button.dataset.option = item.options[index].id;
        button.tabIndex = -1;   // nút phụ: Tab đi thẳng từ ô này sang ô kế tiếp
      });
      return node;
    }

    /** Dựng mới mỗi lần form dựng lại. */
    function node() {
      groups = Object.fromEntries(Object.entries(switches).map(([id, item]) => [id, group(id, item)]));
      const wrap = el('div', 'pass-switches');
      wrap.append(...Object.values(groups));
      return wrap;
    }

    // Chạy cả khi đang gõ trong ô (giống Alt+N), chỉ ở Chuyển case; hộp đang mở (vd xem trước Gửi Telegram) thì thôi để tin không đổi sau lưng.
    document.addEventListener('keydown', (event) => {
      if (!event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || !session.isPassCase() || document.querySelector('dialog[open]')) return;
      const id = Object.keys(switches).find(key => switches[key].shortcut === event.key.toLowerCase());
      if (!id) return;
      event.preventDefault();
      passCaseService.cycleSwitch(id);
      refresh();
    });

    return { node };
  }

  TW.ui.passCaseSwitches = { createPassCaseSwitches };
})(window.TW);
