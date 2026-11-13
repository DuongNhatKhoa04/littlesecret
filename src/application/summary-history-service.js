// src/application/summary-history-service.js — Tóm tắt đã dùng (lưu trên máy) để gợi ý khi gõ ô Tóm tắt.
(function (TW) {
  'use strict';

  const MAX_ENTRIES = 300;   // ponytail: list phẳng, mới nhất đầu; đủ cho gợi ý, không cần index

  /** @param {{ context: object, storage: KeyValueStore }} deps */
  function createSummaryHistoryService({ context, storage }) {
    const key = context.app.summaryKey;
    const saved = storage.read(key);
    let entries = Array.isArray(saved) ? saved.filter(x => typeof x === 'string' && x.trim()) : [];

    return {
      list: () => entries.slice(),
      /** Lưu IN HOA như trên title, đưa lên đầu, bỏ bản trùng. */
      remember(value) {
        const text = String(value || '').trim().toUpperCase();
        if (!text) return;
        entries = [text, ...entries.filter(x => x !== text)].slice(0, MAX_ENTRIES);
        storage.write(key, entries);
      },
      /** Bỏ 1 gợi ý người dùng không muốn giữ (gõ nhầm, gõ dở). */
      forget(value) {
        entries = entries.filter(x => x !== value);
        storage.write(key, entries);
      }
    };
  }

  TW.application.summaryHistoryService = { createSummaryHistoryService };
})(window.TW);
