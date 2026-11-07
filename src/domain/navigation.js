// src/domain/navigation.js — Chọn loại theo cấp: Nhóm → (Viết ticket: loại) | (Setup: Thiết bị → Hãng → Model → Quy trình → Checklist) | (SMS: loại tin nhắn).
(function (TW) {
  'use strict';

  const GROUPS = Object.freeze({ ticket: 'ticket', setup: 'setup', sms: 'sms' });
  const SMS_KINDS = Object.freeze({ shipping: 'shipping' });   // cấp con của nhóm SMS, nhãn ở config/app.js

  const byIdOrFirst = (list, id) => list.find(x => x.id === id) || list[0];

  /** Giữ lựa chọn còn hợp lệ, cấp nào không hợp lệ thì về lựa chọn đầu tiên. */
  function normalizeSetupPath(catalog, path) {
    const wanted = path || {};
    const device = byIdOrFirst(catalog.devices, wanted.device);
    const brand = byIdOrFirst(device.brands, wanted.brand);
    const model = brand.models.includes(wanted.model) ? wanted.model : (brand.models[0] || '');
    const flow = byIdOrFirst(catalog.flows, wanted.flow);
    return { device: device.id, brand: brand.id, model, flow: flow.id };
  }

  /** Loại SMS còn trong config, không thì loại đầu tiên. */
  const normalizeSmsKind = (smsKinds, kind) => byIdOrFirst(smsKinds, kind).id;

  function findBrand(catalog, path) {
    const device = catalog.devices.find(d => d.id === path.device);
    return device ? device.brands.find(b => b.id === path.brand) || null : null;
  }

  const appliesToModel = (setup, model) => !setup.meta.models || setup.meta.models.length === 0 || setup.meta.models.includes(model);

  /** Checklist của nhánh đang chọn, theo thứ tự làm. `path` phải đã normalize. */
  function matchingSetups(setups, path) {
    return setups
      .filter(setup => setup.meta.device === path.device && setup.meta.brand === path.brand &&
        setup.meta.flow === path.flow && appliesToModel(setup, path.model))
      .sort((a, b) => (a.meta.order || 0) - (b.meta.order || 0));
  }

  /** Key loại đang mở; '' khi nhánh setup chưa có checklist hoặc đang ở nhóm SMS (không phải loại ticket). */
  function resolveTypeKey(nav, { tickets, setups, catalog }) {
    if (nav.group === GROUPS.sms) return '';
    if (nav.group !== GROUPS.setup) {
      return tickets.some(t => t.key === nav.ticketType) ? nav.ticketType : tickets[0].key;
    }
    const matches = matchingSetups(setups, normalizeSetupPath(catalog, nav.setupPath));
    if (!matches.length) return '';
    return matches.some(s => s.key === nav.setupType) ? nav.setupType : matches[0].key;
  }

  /** Model ghi vào ticket: chỉ khi đang ở Setup và hãng có model. */
  function activeModel(nav, catalog) {
    return nav.group === GROUPS.setup ? normalizeSetupPath(catalog, nav.setupPath).model : '';
  }

  function createNavigation({ app, tickets, catalog }) {
    return {
      group: GROUPS.ticket, ticketType: tickets[0].key, setupPath: normalizeSetupPath(catalog, null), setupType: '',
      smsKind: app.smsKinds[0].id
    };
  }

  /** Điều hướng tới đúng 1 loại (dùng khi mở template / đọc state bản cũ chỉ lưu key loại). */
  function navigationForType(type, current, catalog) {
    if (type.group !== GROUPS.setup) return { ...current, group: GROUPS.ticket, ticketType: type.key };
    const path = { ...type.meta, model: current.setupPath && current.setupPath.model };
    return { ...current, group: GROUPS.setup, setupPath: normalizeSetupPath(catalog, path), setupType: type.key };
  }

  TW.domain.navigation = {
    GROUPS, SMS_KINDS, normalizeSetupPath, normalizeSmsKind, findBrand, matchingSetups, resolveTypeKey, activeModel, createNavigation, navigationForType
  };
})(window.TW);
