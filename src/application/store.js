// src/application/store.js — Giữ state của phiên làm việc và báo cho các view khi state đổi.
(function (TW) {
  'use strict';

  /**
   * change gửi kèm mỗi lần đổi:
   *   rebuild: true   => cấu trúc form đổi (thêm/xóa ý, đổi loại…), cần dựng lại form
   *   focus: {key,index} => ô cần focus sau khi dựng lại
   *   view: true      => chỉ đổi chế độ xem
   */
  function createStore(initialState) {
    const state = initialState;
    const listeners = new Set();

    return {
      get: () => state,
      update(mutate, change = {}) {
        mutate(state);
        listeners.forEach(listener => listener(change));
      },
      subscribe(listener) {
        listeners.add(listener);
        return () => listeners.delete(listener);
      }
    };
  }

  TW.application.store = { createStore };
})(window.TW);
