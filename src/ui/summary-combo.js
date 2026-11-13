// src/ui/summary-combo.js — Gợi ý cho ô Tóm tắt: danh sách Tóm tắt đã dùng, lọc theo chữ đang gõ, × để xóa gợi ý không muốn giữ.
(function (TW) {
  'use strict';

  const { el, button, isComposing } = TW.ui.dom;
  const { normalizeForSearch } = TW.domain.text;

  const LIST_ID = 'f_summaryHistory';

  function createSummaryCombo({ summaryHistory, ticketService }) {
    /** Gắn danh sách gợi ý dưới ô input trong `wrap` (ô do ticket-form tạo). */
    function attach(wrap) {
      const input = wrap.querySelector('input');
      const list = el('div', 'combo-list');
      list.id = LIST_ID;
      list.setAttribute('role', 'listbox');
      list.hidden = true;
      [['role', 'combobox'], ['aria-expanded', 'false'], ['aria-controls', LIST_ID], ['aria-autocomplete', 'list']]
        .forEach(([name, value]) => input.setAttribute(name, value));
      let shown = [];
      let active = -1;   // -1 = chưa chọn gợi ý nào: Enter giữ hành vi cũ (sang ô kế tiếp)

      const matches = () => {
        const query = normalizeForSearch(input.value.trim());
        return summaryHistory.list().filter(text => normalizeForSearch(text).includes(query));
      };

      function optionRow(text, i) {
        const row = el('div', 'combo-opt' + (i === active ? ' active' : ''));
        row.setAttribute('role', 'option');
        row.setAttribute('aria-selected', String(i === active));
        const remove = button('combo-del', '×', { title: 'Xóa khỏi gợi ý', ariaLabel: 'Xóa gợi ý ' + text, skipTab: true });
        remove.addEventListener('mousedown', (event) => {
          event.preventDefault();   // giữ con trỏ trong ô, không kích hoạt chọn dòng
          event.stopPropagation();
          summaryHistory.forget(text);
          render();
        });
        row.append(el('span', '', text), remove);
        row.addEventListener('mousedown', (event) => { event.preventDefault(); pick(text); });
        return row;
      }

      function render() {
        shown = matches();
        if (active >= shown.length) active = shown.length - 1;
        list.textContent = '';
        shown.forEach((text, i) => list.append(optionRow(text, i)));
        list.hidden = !shown.length;
        input.setAttribute('aria-expanded', String(!list.hidden));
        const current = list.querySelector('.active');
        if (current) current.scrollIntoView({ block: 'nearest' });
      }

      function close() { active = -1; list.hidden = true; input.setAttribute('aria-expanded', 'false'); }

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
