// src/application/session-repository.js — Đọc/lưu phiên làm việc (loại đang chọn, chế độ xem, ticket đang nhập, form SMS Promotion / SMS Shipping).
(function (TW) {
  'use strict';

  const { createEmptyTicket, sanitizeTicket } = TW.domain.ticket;
  const { createEmptySms, sanitizeSms } = TW.domain.sms;
  const { createEmptyShipping, sanitizeShipping } = TW.domain.shipping;
  const { GROUPS, createNavigation, navigationForType, normalizeSetupPath, normalizeSmsKind, resolveTypeKey } = TW.domain.navigation;
  const MODES = ['split', 'input', 'output'];

  /** @param {{ storage: KeyValueStore, context: object }} deps */
  function createSessionRepository({ storage, context }) {
    const { app, blockKeys, catalog } = context;

    const defaults = () => ({
      mode: 'split', swap: false, nav: createNavigation(context), ticket: createEmptyTicket({ app, blockKeys }),
      sms: createEmptySms(context.sms), shipping: createEmptyShipping()
    });

    function sanitizeNav(nav, base) {
      return {
        group: Object.values(GROUPS).includes(nav.group) ? nav.group : base.group,
        ticketType: typeof nav.ticketType === 'string' ? nav.ticketType : base.ticketType,
        setupPath: normalizeSetupPath(catalog, nav.setupPath),
        setupType: typeof nav.setupType === 'string' ? nav.setupType : '',
        smsKind: normalizeSmsKind(app.smsKinds, nav.smsKind)   // bản trước chưa có => Promotion
      };
    }

    function loadNav(raw, base) {
      if (raw.nav && typeof raw.nav === 'object') return sanitizeNav(raw.nav, base);
      const legacyType = context.typeOf(raw.type);   // bản 1 file chỉ lưu key loại
      return legacyType ? navigationForType(legacyType, base, catalog) : base;
    }

    function load() {
      const state = defaults();
      const raw = storage.read(app.storageKey);
      if (!raw || typeof raw !== 'object') return state;
      if (MODES.includes(raw.mode)) state.mode = raw.mode;
      state.swap = raw.swap === true;
      state.nav = loadNav(raw, state.nav);
      const source = raw.ticket || (raw.data && raw.data[raw.type]);   // bản rất cũ lưu riêng từng loại
      if (source) state.ticket = sanitizeTicket(source, { app, blockKeys });
      state.sms = sanitizeSms(raw.sms, context.sms);   // bản trước chưa có sms => mặc định
      state.shipping = sanitizeShipping(raw.shipping);
      return state;
    }

    function save(state) {
      const { mode, swap, nav, ticket, sms, shipping } = state;
      storage.write(app.storageKey, { type: resolveTypeKey(nav, context), mode, swap, nav, ticket, sms, shipping });
    }

    return { load, save };
  }

  TW.application.sessionRepository = { createSessionRepository };
})(window.TW);
