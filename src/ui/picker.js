// src/ui/picker.js — Thanh chọn theo cấp: Nhóm → loại ticket, hoặc Thiết bị → Hãng → Model → Quy trình → Checklist, hoặc loại SMS.
(function (TW) {
  'use strict';

  const { el, segmented } = TW.ui.dom;
  const { GROUPS, findBrand, matchingSetups } = TW.domain.navigation;

  const toOptions = (types) => types.map(type => ({ id: type.key, label: type.label }));

  function createPicker({ root, context, session, navigationService }) {
    const { app, catalog, tickets, setups } = context;
    const { labels } = app;

    /** 1 hàng nút chọn; không có label = hàng không nhãn (Loại ticket, loại SMS). */
    function level({ label = '', options, value, onSelect }) {
      const wrap = el('div', 'picker-level');
      if (label) wrap.append(el('span', 'picker-label', label));
      wrap.append(segmented({ options, value, onSelect, ariaLabel: label || 'Loại ticket' }));
      return wrap;
    }

    function setupLevels() {
      const path = session.setupPath();
      const device = catalog.devices.find(d => d.id === path.device);
      const brand = findBrand(catalog, path);
      // Thiết bị → Hãng → Model → Quy trình: nhãn, giá trị đang chọn, hành động chọn đều theo tên cấp
      const pathLevel = (name, options) => level({
        label: labels[name], options, value: path[name], onSelect: (value) => navigationService.selectSetupLevel(name, value)
      });
      const levels = [pathLevel('device', catalog.devices), pathLevel('brand', device.brands)];
      if (brand.models.length) levels.push(pathLevel('model', brand.models.map(m => ({ id: m, label: m }))));
      levels.push(pathLevel('flow', catalog.flows));
      const matches = matchingSetups(setups, path);
      if (matches.length > 1) {   // vd POS ABC Ship mới: Tạo DB (trước khi ship) → Setup POS (tại tiệm)
        levels.push(level({ label: labels.checklist, options: toOptions(matches), value: session.activeTypeKey(), onSelect: navigationService.selectSetupType }));
      }
      return levels;
    }

    function levelsOf(group) {
      if (group === GROUPS.setup) return setupLevels();
      if (group === GROUPS.sms) return [level({ options: app.smsKinds, value: session.nav().smsKind, onSelect: navigationService.selectSmsKind })];
      return [level({ options: toOptions(tickets), value: session.activeTypeKey(), onSelect: navigationService.selectTicketType })];
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
