// src/application/session.js — Các giá trị suy ra từ state: loại đang mở, model, kết luận, khối SMS Promotion đang bật, đang ở SMS Shipping hay SMS Xin review…
(function (TW) {
  'use strict';

  const { GROUPS, SMS_KINDS, resolveTypeKey, normalizeSetupPath, activeModel } = TW.domain.navigation;
  const { findConclusion } = TW.domain.ticket;

  function createSession({ context, store }) {
    const nav = () => store.get().nav;
    const ticket = () => store.get().ticket;
    const activeTypeKey = () => resolveTypeKey(nav(), context);
    const activeType = () => context.typeOf(activeTypeKey());
    const isSmsKind = (kind) => nav().group === GROUPS.sms && nav().smsKind === kind;

    return {
      context,
      state: () => store.get(),
      nav,
      ticket,
      sms: () => store.get().sms,
      shipping: () => store.get().shipping,
      review: () => store.get().review,
      /** Khối SMS Promotion đang bật: loại đang mở có khối này và đã tick. */
      smsActive: () => { const type = activeType(); return !!type && !!type.smsPromotion && store.get().sms.enabled; },
      isShipping: () => isSmsKind(SMS_KINDS.shipping),
      isReview: () => isSmsKind(SMS_KINDS.review),
      activeTypeKey,
      activeType,
      setupPath: () => normalizeSetupPath(context.catalog, nav().setupPath),
      model: () => activeModel(nav(), context.catalog),
      conclusion: () => findConclusion(context.app, ticket().conclusion)
    };
  }

  TW.application.session = { createSession };
})(window.TW);
