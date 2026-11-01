// src/application/view-service.js — Chế độ xem (Chia đôi / Nhập / Kết quả) và đổi bên.
(function (TW) {
  'use strict';

  const MODES = ['split', 'input', 'output'];
  const NARROW_MODES = ['input', 'output'];   // màn hình hẹp không có Chia đôi

  function createViewService({ store }) {
    const change = (mutate) => store.update(mutate, { view: true });

    /** Màn hình hẹp: Chia đôi hiển thị như Nhập. */
    const effectiveMode = (isNarrow) => isNarrow && store.get().mode === 'split' ? 'input' : store.get().mode;

    return {
      effectiveMode,
      setMode(mode) { if (MODES.includes(mode)) change(state => { state.mode = mode; }); },
      cycleMode(isNarrow) {
        const order = isNarrow ? NARROW_MODES : MODES;
        const next = order[(order.indexOf(effectiveMode(isNarrow)) + 1) % order.length];
        change(state => { state.mode = next; });
      },
      toggleSwap() { change(state => { state.swap = !state.swap; }); }
    };
  }

  TW.application.viewService = { createViewService };
})(window.TW);
