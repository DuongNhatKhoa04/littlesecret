// src/application/summary-history-service.js — Chữ đã dùng (lưu trên máy) để gợi ý khi gõ: Tóm tắt (mặc định), tên tag Chuyển case.
(function (TW) {
  'use strict';

  const MAX_ENTRIES = 300;   // ponytail: list phẳng, mới nhất đầu; đủ cho gợi ý, không cần index

  const toUpper = (text) => text.trim().toUpperCase();   // Tóm tắt lưu IN HOA như trên title

  /** @param {{ context: object, storage: KeyValueStore, key?: string, normalize?: (text: string) => string }} deps   normalize: chữ trước khi lưu, '' = bỏ */
  function createSummaryHistoryService({ context, storage, key = context.app.summaryKey, normalize = toUpper }) {
    const saved = storage.read(key);
    let entries = Array.isArray(saved) ? saved.filter(x => typeof x === 'string' && x.trim()) : [];

    return {
      list: () => entries.slice(),
      /** Lưu sau khi normalize, đưa lên đầu, bỏ bản trùng. */
      remember(value) {
        const text = normalize(String(value || ''));
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
