// src/ui/summary-combo.js — Gợi ý cho ô Tóm tắt: danh sách Tóm tắt đã dùng, lọc theo chữ đang gõ, × để xóa gợi ý không muốn giữ.
(function (TW) {
  'use strict';

  const { attachSuggestions } = TW.ui.combo;

  const LIST_ID = 'f_summaryHistory';

  function createSummaryCombo({ summaryHistory, ticketService }) {
    /** Gắn danh sách gợi ý dưới ô input trong `wrap` (ô do ticket-form tạo). */
    function attach(wrap) {
      const input = wrap.querySelector('input');
      attachSuggestions({
        wrap, listId: LIST_ID, items: summaryHistory.list, onForget: summaryHistory.forget,
        onPick: (text) => ticketService.setField('summary', text)
      });
      input.addEventListener('change', () => summaryHistory.remember(input.value));   // change = rời ô, không lưu từng phím
      return wrap;
    }

    return { attach };
  }

  TW.ui.summaryCombo = { createSummaryCombo };
})(window.TW);
