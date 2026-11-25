// src/ui/picker.js — Tab chọn loại (loại ticket, loại SMS, nhóm Setup) + các cấp Thiết bị → Hãng → Model → Quy trình → Checklist khi ở Setup.
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

    // 1 hàng tab thay cho 2 tầng Nhóm → loại: loại ticket và loại SMS hiện thẳng, nhóm Setup là 1 tab (cấp con hiện sau).
    // id tab = "<nhóm>:<loại>" vì key loại ticket và id loại SMS có thể trùng nhau.
    const TAB_ACTIONS = {
      [GROUPS.ticket]: (key) => navigationService.selectTicketType(key),
      [GROUPS.sms]: (kind) => navigationService.selectSmsKind(kind),
      [GROUPS.setup]: () => navigationService.selectGroup(GROUPS.setup)
    };

    function tabOptions() {
      return app.groups.flatMap(group => {
        if (group.id === GROUPS.ticket) return tickets.map(type => ({ id: `${group.id}:${type.key}`, label: type.label }));
        if (group.id === GROUPS.sms) return app.smsKinds.map(kind => ({ id: `${group.id}:${kind.id}`, label: kind.label }));
        return [{ id: `${group.id}:`, label: group.label, hidden: group.hidden }];
      });
    }

    function activeTab() {
      const { group, smsKind } = session.nav();
      if (group === GROUPS.sms) return `${group}:${smsKind}`;
      return group === GROUPS.setup ? `${group}:` : `${GROUPS.ticket}:${session.activeTypeKey()}`;
    }

    function selectTab(id) {
      const [group, key] = id.split(':');
      TAB_ACTIONS[group](key);
    }

    function render() {
      root.textContent = '';
      const tabs = segmented({ options: tabOptions(), value: activeTab(), onSelect: selectTab, ariaLabel: 'Loại ticket' });
      tabs.classList.add('tabs');
      root.append(tabs);
      if (session.nav().group === GROUPS.setup) root.append(el('span', 'picker-sep'), ...setupLevels());
    }

    return { render };
  }

  TW.ui.picker = { createPicker };
})(window.TW);
