// src/ui/category-combo.js — Ô Loại: chọn nhiều thẻ, gõ để lọc, thứ tự chọn = thứ tự trong title.
(function (TW) {
  'use strict';

  const { el, button, isComposing } = TW.ui.dom;
  const { parseCategories } = TW.domain.title;
  const { normalizeForSearch, cleanCategory } = TW.domain.text;

  const HINT = 'Chọn lần lượt, ví dụ ABC rồi CLOVER rồi INTERNET. Gõ để lọc, Enter (hoặc Tab) để chọn, Backspace để bỏ loại cuối. Loại chưa có thì gõ tên rồi Enter để thêm.';
  const ALL_PICKED = 'Đã chọn hết các loại có sẵn. Gõ để thêm loại mới.';

  function createCategoryCombo({ context, session, ticketService, categories }) {
    function build() {
      const field = el('div', 'field');
      const label = el('label', '', context.app.labels.category);
      label.htmlFor = 'f_category';
      const box = el('div', 'combo-box');
      const input = el('input', 'combo-input');
      Object.assign(input, { id: 'f_category', type: 'text', autocomplete: 'off' });
      [['role', 'combobox'], ['aria-expanded', 'false'], ['aria-controls', 'catList'], ['aria-autocomplete', 'list']]
        .forEach(([name, value]) => input.setAttribute(name, value));
      const list = el('div', 'combo-list');
      list.id = 'catList';
      list.setAttribute('role', 'listbox');
      list.hidden = true;
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
        const row = el('div', 'combo-opt' + (i === active ? ' active' : ''));
        row.setAttribute('role', 'option');
        row.setAttribute('aria-selected', String(i === active));
        row.append(el('span', '', option.isNew ? `+ Thêm “${option.value}”` : option.value));
        if (!option.isNew && !categories.isBuiltIn(option.value)) {   // loại tự thêm thì xóa được khỏi danh sách
          const remove = button('combo-del', '×', { title: 'Xóa khỏi danh sách', skipTab: true });
          remove.addEventListener('mousedown', (event) => {
            event.preventDefault();
            event.stopPropagation();
            categories.remove(option.value);
            renderList();
          });
          row.append(remove);
        }
        row.addEventListener('mousedown', (event) => { event.preventDefault(); pick(option); });
        row.addEventListener('mousemove', () => { if (active !== i) { active = i; renderList(); } });
        return row;
      }

      function renderList() {
        shown = computeOptions();
        if (active >= shown.length) active = Math.max(0, shown.length - 1);
        list.textContent = '';
        if (!shown.length) list.append(el('div', 'combo-empty', ALL_PICKED));
        shown.forEach((option, i) => list.append(optionRow(option, i)));
        const current = list.querySelector('.active');
        if (current) current.scrollIntoView({ block: 'nearest' });
      }

      function open() { list.hidden = false; input.setAttribute('aria-expanded', 'true'); renderList(); }
      function close() { list.hidden = true; input.setAttribute('aria-expanded', 'false'); }

      function pick(option) {
        if (!option) return;
        if (option.isNew) categories.add(option.value);
        setTags([...tags(), option.value]);
        input.value = '';
        active = 0;
        renderList();
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
        else if (event.key === 'Tab' && input.value.trim() && !list.hidden) pick(shown[active]);   // gõ dở mà Tab đi thì không mất chữ
        else if (event.key === 'Escape' && !list.hidden) { event.preventDefault(); event.stopPropagation(); close(); }
        else if (event.key === 'Backspace' && !input.value && tags().length) {
          event.preventDefault();
          setTags(tags().slice(0, -1));
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
