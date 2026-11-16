// src/ui/summary-combo.js — Gợi ý cho ô Tóm tắt: danh sách Tóm tắt đã dùng, lọc theo chữ đang gõ, × để xóa gợi ý không muốn giữ.
(function (TW) {
  'use strict';

  const { el, isComposing, comboList, showComboList, scrollToActive, comboOption } = TW.ui.dom;
  const { normalizeForSearch } = TW.domain.text;

  const LIST_ID = 'f_summaryHistory';

  function createSummaryCombo({ summaryHistory, ticketService }) {
    /** Gắn danh sách gợi ý dưới ô input trong `wrap` (ô do ticket-form tạo). */
    function attach(wrap) {
      const input = wrap.querySelector('input');
      const list = comboList(input, LIST_ID);
      let shown = [];
      let active = -1;   // -1 = chưa chọn gợi ý nào: Enter giữ hành vi cũ (sang ô kế tiếp)

      const matches = () => {
        const query = normalizeForSearch(input.value.trim());
        return summaryHistory.list().filter(text => normalizeForSearch(text).includes(query));
      };

      const optionRow = (text, i) => comboOption({
        text, active: i === active, onPick: () => pick(text),
        remove: { title: 'Xóa khỏi gợi ý', ariaLabel: 'Xóa gợi ý ' + text, onRemove: () => { summaryHistory.forget(text); render(); } }
      });

      function render() {
        shown = matches();
        if (active >= shown.length) active = shown.length - 1;
        list.textContent = '';
        shown.forEach((text, i) => list.append(optionRow(text, i)));
        showComboList(input, list, shown.length > 0);
        scrollToActive(list);
      }

      function close() { active = -1; showComboList(input, list, false); }

      function pick(text) {
        input.value = text;
        ticketService.setField('summary', text);
        close();
      }

      function move(step) {
        if (list.hidden) { active = -1; render(); return; }
        active = (active + step + shown.length + 1) % (shown.length + 1);   // vòng qua -1 = về chữ đang gõ
        if (active === shown.length) active = -1;
        render();
      }

      // Bắt ở pha capture của wrap để chạy trước handler Enter của ô (sang ô kế tiếp)
      wrap.addEventListener('keydown', (event) => {
        if (isComposing(event)) return;
        if (event.key === 'ArrowDown') { event.preventDefault(); move(1); }
        else if (event.key === 'ArrowUp' && !list.hidden) { event.preventDefault(); move(-1); }
        else if (event.key === 'Enter' && !list.hidden && active >= 0) { event.preventDefault(); pick(shown[active]); }
        else if (event.key === 'Escape' && !list.hidden) { event.preventDefault(); event.stopPropagation(); close(); }
      }, true);
      input.addEventListener('input', () => { active = -1; if (input.value.trim()) render(); else close(); });
      input.addEventListener('blur', close);
      input.addEventListener('change', () => summaryHistory.remember(input.value));   // change = rời ô, không lưu từng phím

      const combo = el('div', 'combo');
      input.replaceWith(combo);
      combo.append(input, list);
      return wrap;
    }

    return { attach };
  }

  TW.ui.summaryCombo = { createSummaryCombo };
})(window.TW);
