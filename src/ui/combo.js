// src/ui/combo.js — Phần dùng chung của ô có danh sách gợi ý (ARIA combobox + listbox): ô Loại, ô Tóm tắt, ô Thêm tag.
(function (TW) {
  'use strict';

  const { el, button, isComposing } = TW.ui.dom;
  const { searchSuggestions } = TW.domain.text;

  /** Danh sách gợi ý cho ô `input`; ban đầu ẩn. */
  function comboList(input, id) {
    const list = el('div', 'combo-list');
    list.id = id;
    list.setAttribute('role', 'listbox');
    list.hidden = true;
    [['role', 'combobox'], ['aria-expanded', 'false'], ['aria-controls', id], ['aria-autocomplete', 'list']]
      .forEach(([name, value]) => input.setAttribute(name, value));
    return list;
  }

  /** Hiện / ẩn danh sách gợi ý, báo cho trình đọc màn hình qua aria-expanded. */
  function showComboList(input, list, show) {
    list.hidden = !show;
    input.setAttribute('aria-expanded', String(show));
  }

  /** Sau khi vẽ lại danh sách: cuộn để thấy dòng đang sáng. */
  function scrollToActive(list) {
    const current = list.querySelector('.active');
    if (current) current.scrollIntoView({ block: 'nearest' });
  }

  /**
   * 1 dòng gợi ý. Bấm chuột = chọn (mousedown + preventDefault: con trỏ vẫn ở trong ô).
   * remove (nếu có) = nút × xóa gợi ý, không kích hoạt chọn dòng.
   * @param {{ text: string, active: boolean, onPick: Function, remove?: { title: string, ariaLabel?: string, onRemove: Function } }} option
   */
  function comboOption({ text, active, onPick, remove }) {
    const row = el('div', 'combo-opt' + (active ? ' active' : ''));
    row.setAttribute('role', 'option');
    row.setAttribute('aria-selected', String(active));
    row.append(el('span', '', text));
    if (remove) {
      const del = button('combo-del', '×', { title: remove.title, ariaLabel: remove.ariaLabel, skipTab: true });
      del.addEventListener('mousedown', (event) => {
        event.preventDefault();
        event.stopPropagation();
        remove.onRemove();
      });
      row.append(del);
    }
    row.addEventListener('mousedown', (event) => { event.preventDefault(); onPick(); });
    return row;
  }

  /**
   * Gợi ý từ danh sách đã lưu cho ô input trong `wrap` (ô Tóm tắt, ô Thêm tag): lọc theo chữ đang gõ, ↓/↑ chọn, Enter điền, Esc đóng, × xóa gợi ý.
   * Enter khi chưa chọn gợi ý thì để handler của ô tự xử lý. Chọn gợi ý thì event Enter bị preventDefault.
   * @param {{ wrap: HTMLElement, listId: string, items: () => string[], onPick: (text: string) => void, onForget: (text: string) => void, toQuery?: (text: string) => string }} options
   */
  function attachSuggestions({ wrap, listId, items, onPick, onForget, toQuery = (text) => text }) {
    const input = wrap.querySelector('input');
    const list = comboList(input, listId);
    let shown = [];
    let active = -1;   // -1 = chưa chọn gợi ý nào

    const optionRow = (text, i) => comboOption({
      text, active: i === active, onPick: () => pick(text),
      remove: { title: 'Xóa khỏi gợi ý', ariaLabel: 'Xóa gợi ý ' + text, onRemove: () => { onForget(text); render(); } }
    });

    function render() {
      shown = searchSuggestions(items(), toQuery(input.value));
      if (active >= shown.length) active = shown.length - 1;
      list.textContent = '';
      shown.forEach((text, i) => list.append(optionRow(text, i)));
      showComboList(input, list, shown.length > 0);
      scrollToActive(list);
    }

    function close() { active = -1; showComboList(input, list, false); }

    function pick(text) {
      input.value = text;
      close();
      onPick(text);
    }

    function move(step) {
      if (list.hidden) { active = -1; render(); return; }
      active = (active + step + shown.length + 1) % (shown.length + 1);   // vòng qua -1 = về chữ đang gõ
      if (active === shown.length) active = -1;
      render();
    }

    // Bắt ở pha capture của wrap để chạy trước handler Enter của ô
    wrap.addEventListener('keydown', (event) => {
      if (isComposing(event)) return;
      if (event.key === 'ArrowDown') { event.preventDefault(); move(1); }
      else if (event.key === 'ArrowUp' && !list.hidden) { event.preventDefault(); move(-1); }
      else if (event.key === 'Enter' && !list.hidden && active >= 0) { event.preventDefault(); pick(shown[active]); }
      else if (event.key === 'Escape' && !list.hidden) { event.preventDefault(); event.stopPropagation(); close(); }
    }, true);
    input.addEventListener('input', () => { active = -1; if (input.value.trim()) render(); else close(); });
    input.addEventListener('blur', close);

    const combo = el('div', 'combo');
    input.replaceWith(combo);
    combo.append(input, list);
  }

  TW.ui.combo = { comboList, showComboList, scrollToActive, comboOption, attachSuggestions };
})(window.TW);
