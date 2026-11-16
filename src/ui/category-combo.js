// src/ui/category-combo.js — Ô Loại: chọn 1 loại (chọn loại khác thì thay), gõ để lọc, chọn xong con trỏ sang Tóm tắt.
(function (TW) {
  'use strict';

  const { $, el, button, isComposing, comboList, showComboList, scrollToActive, comboOption } = TW.ui.dom;
  const { parseCategories } = TW.domain.title;
  const { normalizeForSearch, cleanCategory } = TW.domain.text;

  const HINT = 'Chọn 1 loại: gõ để lọc, Enter (hoặc Tab) để chọn, xong tự sang Tóm tắt. Chọn loại khác thì thay loại cũ, Backspace để bỏ. Loại chưa có thì gõ tên rồi Enter để thêm.';
  const NO_OTHER = 'Không còn loại nào khác. Gõ để thêm loại mới.';
  const NEXT_FIELD = '#f_summary';
  const LIST_ID = 'catList';

  function createCategoryCombo({ context, session, ticketService, categories }) {
    function build() {
      const field = el('div', 'field');
      const label = el('label', '', context.app.labels.category);
      label.htmlFor = 'f_category';
      const box = el('div', 'combo-box');
      const input = el('input', 'combo-input');
      Object.assign(input, { id: 'f_category', type: 'text', autocomplete: 'off' });
      const list = comboList(input, LIST_ID);
      let shown = [];
      let active = 0;

      const tags = () => parseCategories(session.ticket().category);
      const setTags = (next) => { ticketService.setCategories(next); renderChips(); };

      function renderChips() {
        box.querySelectorAll('.chip').forEach(chip => chip.remove());
        tags().forEach((tag, i) => {
          const chip = el('span', 'chip', tag);
          chip.append(button('', '×', { ariaLabel: 'Bỏ ' + tag, skipTab: true, onClick: (event) => {
            event.stopPropagation();
            setTags(tags().filter((_, j) => j !== i));
            input.focus();
            renderList();
          } }));
          box.insertBefore(chip, input);
        });
        input.placeholder = tags().length ? '' : 'Chọn hoặc gõ để tìm…';
      }

      function computeOptions() {
        const query = normalizeForSearch(input.value.trim());
        const picked = new Set(tags());
        const options = categories.options()
          .filter(o => !picked.has(o) && (!query || normalizeForSearch(o).includes(query)))
          .map(value => ({ value }));
        const typed = cleanCategory(input.value);
        if (typed && !categories.options().includes(typed) && !picked.has(typed)) options.push({ value: typed, isNew: true });
        return options;
      }

      function optionRow(option, i) {
        const removable = !option.isNew && !categories.isBuiltIn(option.value);   // loại tự thêm thì xóa được khỏi danh sách
        const row = comboOption({
          text: option.isNew ? `+ Thêm “${option.value}”` : option.value,
          active: i === active,
          onPick: () => pick(option),
          remove: removable ? { title: 'Xóa khỏi danh sách', onRemove: () => { categories.remove(option.value); renderList(); } } : null
        });
        row.addEventListener('mousemove', () => { if (active !== i) { active = i; renderList(); } });
        return row;
      }

      function renderList() {
        shown = computeOptions();
        if (active >= shown.length) active = Math.max(0, shown.length - 1);
        list.textContent = '';
        if (!shown.length) list.append(el('div', 'combo-empty', NO_OTHER));
        shown.forEach((option, i) => list.append(optionRow(option, i)));
        scrollToActive(list);
      }

      function open() { showComboList(input, list, true); renderList(); }
      function close() { showComboList(input, list, false); }

      /** Chỉ 1 loại: chọn là thay loại cũ. Xong thì sang Tóm tắt (blur tự đóng danh sách). true = đã chọn */
      function pick(option) {
        if (!option) return false;
        if (option.isNew) categories.add(option.value);
        setTags([option.value]);
        input.value = '';
        active = 0;
        const next = $(NEXT_FIELD);
        if (next) next.focus(); else close();
        return true;
      }

      function moveActive(step) {
        if (list.hidden) { open(); return; }
        const size = Math.max(1, shown.length);
        active = (active + step + size) % size;
        renderList();
      }

      function onKeydown(event) {
        if (isComposing(event)) return;
        if (event.key === 'ArrowDown') { event.preventDefault(); moveActive(1); }
        else if (event.key === 'ArrowUp') { event.preventDefault(); moveActive(-1); }
        else if (event.key === 'Enter') { event.preventDefault(); if (!list.hidden) pick(shown[active]); }
        // Gõ dở mà Tab đi thì không mất chữ; đã tự sang Tóm tắt nên chặn Tab, không thì nhảy quá 1 ô
        else if (event.key === 'Tab' && !event.shiftKey && input.value.trim() && !list.hidden) { if (pick(shown[active])) event.preventDefault(); }
        else if (event.key === 'Escape' && !list.hidden) { event.preventDefault(); event.stopPropagation(); close(); }
        else if (event.key === 'Backspace' && !input.value && tags().length) {
          event.preventDefault();
          setTags([]);
          renderList();
        }
      }

      input.addEventListener('focus', open);
      input.addEventListener('blur', close);
      input.addEventListener('input', () => { active = 0; open(); });
      input.addEventListener('keydown', onKeydown);
      box.addEventListener('click', () => input.focus());
      box.append(input);
      const combo = el('div', 'combo');
      combo.append(box, list);
      field.append(label, combo, el('div', 'hint', HINT));
      renderChips();
      return field;
    }

    return { build };
  }

  TW.ui.categoryCombo = { createCategoryCombo };
})(window.TW);
