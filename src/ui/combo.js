// src/ui/combo.js — Phần dùng chung của ô có danh sách gợi ý (ARIA combobox + listbox): ô Loại, ô Tóm tắt.
(function (TW) {
  'use strict';

  const { el, button } = TW.ui.dom;

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

  TW.ui.combo = { comboList, showComboList, scrollToActive, comboOption };
})(window.TW);
