// src/application/session.js — Các giá trị suy ra từ state: loại đang mở, model, kết luận, đang ở SMS Promotion hay SMS Shipping…
(function (TW) {
  'use strict';

  const { GROUPS, SMS_KINDS, resolveTypeKey, normalizeSetupPath, activeModel } = TW.domain.navigation;
  const { findConclusion } = TW.domain.ticket;

  function createSession({ context, store }) {
    const nav = () => store.get().nav;
    const ticket = () => store.get().ticket;
    const activeTypeKey = () => resolveTypeKey(nav(), context);
    const isSmsKind = (kind) => nav().group === GROUPS.sms && nav().smsKind === kind;

    return {
      context,
      state: () => store.get(),
      nav,
      ticket,
      sms: () => store.get().sms,
      shipping: () => store.get().shipping,
      isPromotion: () => isSmsKind(SMS_KINDS.promotion),
      isShipping: () => isSmsKind(SMS_KINDS.shipping),
      activeTypeKey,
      activeType: () => context.typeOf(activeTypeKey()),
      setupPath: () => normalizeSetupPath(context.catalog, nav().setupPath),
      model: () => activeModel(nav(), context.catalog),
      conclusion: () => findConclusion(context.app, ticket().conclusion)
    };
  }

  TW.application.session = { createSession };
})(window.TW);
