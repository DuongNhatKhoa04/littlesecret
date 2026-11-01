// tests/navigation.test.js — Chọn loại theo cấp và tìm checklist của nhánh.
(function (TW) {
  'use strict';

  const { test, assertEqual } = TW.tests;
  const N = TW.domain.navigation;
  const context = TW.application.context.createContext(TW.registry);
  const keysOf = (path) => N.matchingSetups(context.setups, N.normalizeSetupPath(context.catalog, path)).map(s => s.key);

  test('normalize: mặc định lấy lựa chọn đầu, giữ lựa chọn còn hợp lệ', () => {
    assertEqual(N.normalizeSetupPath(context.catalog, null), { device: 'pos', brand: 'abc', model: '', flow: 'new' });
    assertEqual(N.normalizeSetupPath(context.catalog, { device: 'terminal', brand: 'pax', model: 'A3700', flow: 'replace' }),
      { device: 'terminal', brand: 'pax', model: 'A3700', flow: 'replace' });
    assertEqual(N.normalizeSetupPath(context.catalog, { device: 'terminal', brand: 'valor', model: 'A920', flow: 'new' }).model, 'VL100');
  });

  test('POS ABC Ship mới: Tạo DB trước, Setup POS sau', () => {
    assertEqual(keysOf({ device: 'pos', brand: 'abc', flow: 'new' }), ['newDb', 'setup']);
  });

  test('mỗi nhánh có sẵn tìm đúng checklist', () => {
    assertEqual(keysOf({ device: 'terminal', brand: 'pax', model: 'A920 Pro', flow: 'new' }), ['setupPax']);
    assertEqual(keysOf({ device: 'terminal', brand: 'valor', model: 'VL550', flow: 'new' }), ['setupTraining']);
    assertEqual(keysOf({ device: 'terminal', brand: 'valor', model: 'VL100', flow: 'replace' }), ['setupValor']);
  });

  test('nhánh chưa có checklist => loại rỗng', () => {
    assertEqual(keysOf({ device: 'terminal', brand: 'clover', flow: 'new' }), []);
    const nav = { group: 'setup', setupPath: { device: 'pos', brand: 'abc', flow: 'replace' }, setupType: '' };
    assertEqual(N.resolveTypeKey(nav, context), '');
  });

  test('checklist chỉ cho 1 model không hiện ở model khác', () => {
    const only = { key: 'x', meta: { device: 'terminal', brand: 'pax', flow: 'new', models: ['A3700'] } };
    const path = { device: 'terminal', brand: 'pax', model: 'A920', flow: 'new' };
    assertEqual(N.matchingSetups([only], path), []);
    assertEqual(N.matchingSetups([only], { ...path, model: 'A3700' }).length, 1);
  });

  test('model chỉ ghi khi ở Setup và hãng có model', () => {
    assertEqual(N.activeModel({ group: 'ticket', setupPath: { device: 'terminal', brand: 'pax' } }, context.catalog), '');
    assertEqual(N.activeModel({ group: 'setup', setupPath: { device: 'pos' } }, context.catalog), '');
    assertEqual(N.activeModel({ group: 'setup', setupPath: { device: 'terminal', brand: 'clover' } }, context.catalog), 'Clover Flex');
  });

  test('điều hướng tới 1 loại (template / state bản cũ)', () => {
    const base = N.createNavigation(context);
    const nav = N.navigationForType(context.typeOf('setupValor'), base, context.catalog);
    assertEqual([nav.group, nav.setupPath.brand, nav.setupPath.flow, N.resolveTypeKey(nav, context)], ['setup', 'valor', 'replace', 'setupValor']);
    assertEqual(N.resolveTypeKey(N.navigationForType(context.typeOf('transfer'), nav, context.catalog), context), 'transfer');
    assertEqual(N.resolveTypeKey(N.navigationForType(context.typeOf('request'), nav, context.catalog), context), 'incident');   // đã gộp
  });
})(window.TW);
