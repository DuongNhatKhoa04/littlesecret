// src/ui/idea-list.js — Danh sách ý của 1 mục: mỗi ý 1 ô nhập tự giãn, Enter tạo ý mới, ↑ ↓ × sắp xếp/xóa.
(function (TW) {
  'use strict';

  const { el, button, autoGrow, isComposing, applyCase } = TW.ui.dom;
  const { capitalizeLines } = TW.domain.text;

  function createIdeaList({ context, session, ticketService }) {
    const ideasOf = (key) => session.ticket().blocks[key];

    function commit(textarea, key, index) {
      if (context.app.autoCapitalize) applyCase(textarea, capitalizeLines);   // viết hoa đầu dòng ngay khi gõ
      ticketService.setIdea(key, index, textarea.value);
      autoGrow(textarea);
    }

    function onKeydown(event, key, index) {
      if (isComposing(event)) return;
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        ticketService.insertIdea(key, index + 1);
      } else if (event.key === 'Backspace' && event.currentTarget.value === '' && ideasOf(key).length > 1) {
        event.preventDefault();
        ticketService.removeIdea(key, index);
      }
    }

    function tools(key, index) {
      const wrap = el('div', 'tools');
      const last = ideasOf(key).length - 1;
      const tool = ({ text, title, onClick, disabled = false }) =>
        button('', text, { title, ariaLabel: title, onClick, disabled, skipTab: true });
      wrap.append(
        tool({ text: '↑', title: 'Chuyển lên', onClick: () => ticketService.moveIdea(key, index, index - 1), disabled: index === 0 }),
        tool({ text: '↓', title: 'Chuyển xuống', onClick: () => ticketService.moveIdea(key, index, index + 1), disabled: index === last }),
        tool({ text: '×', title: 'Xóa ý này', onClick: () => ticketService.clearIdea(key, index) })
      );
      return wrap;
    }

    function row(section, index) {
      const { key } = section;
      const textarea = el('textarea');
      textarea.rows = 1;
      textarea.value = ideasOf(key)[index];
      textarea.placeholder = index === 0 ? (section.ph || '') : '';
      textarea.dataset.key = key;
      textarea.dataset.i = index;
      textarea.spellcheck = false;
      textarea.addEventListener('input', (event) => {
        if (event.isComposing) { ticketService.setIdea(key, index, textarea.value); autoGrow(textarea); return; }
        commit(textarea, key, index);
      });
      // Gõ dấu tiếng Việt xong mới viết hoa
      textarea.addEventListener('compositionend', () => setTimeout(() => commit(textarea, key, index), 0));
      textarea.addEventListener('keydown', (event) => onKeydown(event, key, index));
      const wrap = el('div', 'block');
      wrap.append(el('span', 'dash', '-'), textarea, tools(key, index));
      return wrap;
    }

    function build(section) {
      const list = el('div');
      ideasOf(section.key).forEach((_, index) => list.append(row(section, index)));
      return list;
    }

    return { build };
  }

  TW.ui.ideaList = { createIdeaList };
})(window.TW);
