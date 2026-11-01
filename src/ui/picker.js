// src/ui/picker.js — Thanh chọn theo cấp: Nhóm → loại ticket, hoặc Thiết bị → Hãng → Model → Quy trình → Checklist, hoặc loại SMS.
(function (TW) {
  'use strict';

  const { el, segmented } = TW.ui.dom;
  const { GROUPS, findBrand, matchingSetups } = TW.domain.navigation;

  const toOptions = (types) => types.map(type => ({ id: type.key, label: type.label }));

  function createPicker({ root, context, session, navigationService }) {
    const { app, catalog, tickets, setups } = context;
    const { labels } = app;

    function level(label, options, value, onSelect) {
      const wrap = el('div', 'picker-level');
      if (label) wrap.append(el('span', 'picker-label', label));
      wrap.append(segmented({ options, value, onSelect, ariaLabel: label || 'Loại ticket' }));
      return wrap;
    }

    function setupLevels() {
      const path = session.setupPath();
      const device = catalog.devices.find(d => d.id === path.device);
      const brand = findBrand(catalog, path);
      const select = (name) => (value) => navigationService.selectSetupLevel(name, value);
      const levels = [
        level(labels.device, catalog.devices, path.device, select('device')),
        level(labels.brand, device.brands, path.brand, select('brand'))
      ];
      if (brand.models.length) {
        levels.push(level(labels.model, brand.models.map(m => ({ id: m, label: m })), path.model, select('model')));
      }
      levels.push(level(labels.flow, catalog.flows, path.flow, select('flow')));
      const matches = matchingSetups(setups, path);
      if (matches.length > 1) {   // vd POS ABC Ship mới: Tạo DB (trước khi ship) → Setup POS (tại tiệm)
        levels.push(level(labels.checklist, toOptions(matches), session.activeTypeKey(), navigationService.selectSetupType));
      }
      return levels;
    }

    function levelsOf(group) {
      if (group === GROUPS.setup) return setupLevels();
      if (group === GROUPS.sms) return [level('', app.smsKinds, session.nav().smsKind, navigationService.selectSmsKind)];
      return [level('', toOptions(tickets), session.activeTypeKey(), navigationService.selectTicketType)];
    }

    function render() {
      root.textContent = '';
      const { group } = session.nav();
      root.append(segmented({ options: app.groups, value: group, onSelect: navigationService.selectGroup, ariaLabel: 'Nhóm' }));
      const levels = levelsOf(group);
      if (levels.length) root.append(el('span', 'picker-sep'), ...levels);
    }

    return { render };
  }

  TW.ui.picker = { createPicker };
})(window.TW);
