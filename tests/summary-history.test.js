// tests/summary-history.test.js — Gợi ý Tóm tắt: lưu Tóm tắt đã dùng, mới nhất đầu, không trùng.
(function (TW) {
  'use strict';

  const { test, assertEqual } = TW.tests;
  const A = TW.application;
  const context = A.context.createContext(TW.registry);
  const key = context.app.summaryKey;

  function fakeStorage(initial) {
    const data = { ...initial };
    return { data, read: (name) => name in data ? data[name] : null, write: (name, value) => { data[name] = value; return true; } };
  }

  test('gợi ý Tóm tắt: dữ liệu hỏng => rỗng, bỏ phần tử lạ', () => {
    assertEqual(A.summaryHistoryService.createSummaryHistoryService({ context, storage: fakeStorage({ [key]: 'x' }) }).list(), []);
    assertEqual(A.summaryHistoryService.createSummaryHistoryService({ context, storage: fakeStorage({ [key]: ['a', 1, ' '] }) }).list(), ['a']);
  });

  test('gợi ý Tóm tắt: lưu IN HOA, mới nhất đầu, không trùng, bỏ rỗng', () => {
    const storage = fakeStorage({});
    const history = A.summaryHistoryService.createSummaryHistoryService({ context, storage });
    ['Ticket', 'transaction ', '  ', 'ticket'].forEach(history.remember);
    assertEqual(history.list(), ['TICKET', 'TRANSACTION']);
    assertEqual(storage.data[key], ['TICKET', 'TRANSACTION']);
  });
})(window.TW);
