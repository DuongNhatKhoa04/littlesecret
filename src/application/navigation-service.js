// src/application/navigation-service.js — Đổi nhóm / loại / nhánh setup / loại SMS đang chọn.
(function (TW) {
  'use strict';

  const { normalizeSetupPath } = TW.domain.navigation;
  const SETUP_LEVELS = ['device', 'brand', 'model', 'flow'];

  function createNavigationService({ context, store }) {
    const go = (mutate) => store.update(state => mutate(state.nav), { rebuild: true });

    return {
      selectGroup(group) { go(nav => { nav.group = group; }); },
      selectTicketType(key) { go(nav => { nav.ticketType = key; }); },
      /** Đổi 1 cấp; cấp dưới giữ lựa chọn nếu còn hợp lệ, không thì về lựa chọn đầu tiên. */
      selectSetupLevel(level, value) {
        if (!SETUP_LEVELS.includes(level)) throw new Error(`Cấp chọn "${level}" không tồn tại`);
        go(nav => { nav.setupPath = normalizeSetupPath(context.catalog, { ...nav.setupPath, [level]: value }); });
      },
      selectSetupType(key) { go(nav => { nav.setupType = key; }); },
      selectSmsKind(kind) { go(nav => { nav.smsKind = kind; }); }
    };
  }

  TW.application.navigationService = { createNavigationService };
})(window.TW);
