// src/application/session.js — Các giá trị suy ra từ state: loại đang mở, model, kết luận, khối SMS Promotion đang bật, đang ở SMS Shipping…
(function (TW) {
  'use strict';

  const { GROUPS, SMS_KINDS, resolveTypeKey, normalizeSetupPath, activeModel } = TW.domain.navigation;
  const { findConclusion } = TW.domain.ticket;

  function createSession({ context, store }) {
    const nav = () => store.get().nav;
    const ticket = () => store.get().ticket;
    const activeTypeKey = () => resolveTypeKey(nav(), context);
    const activeType = () => context.typeOf(activeTypeKey());

    return {
      context,
      state: () => store.get(),
      nav,
      ticket,
      sms: () => store.get().sms,
      shipping: () => store.get().shipping,
      /** Khối SMS Promotion đang bật: loại đang mở có khối này và đã tick. */
      smsActive: () => { const type = activeType(); return !!type && !!type.smsPromotion && store.get().sms.enabled; },
      isShipping: () => nav().group === GROUPS.sms && nav().smsKind === SMS_KINDS.shipping,
      activeTypeKey,
      activeType,
      setupPath: () => normalizeSetupPath(context.catalog, nav().setupPath),
      model: () => activeModel(nav(), context.catalog),
      conclusion: () => findConclusion(context.app, ticket().conclusion)
    };
  }

  TW.application.session = { createSession };
})(window.TW);
