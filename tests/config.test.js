// tests/config.test.js — Config hợp lệ: key loại cũ còn đủ, meta khớp catalog, id mục duy nhất.
(function (TW) {
  'use strict';

  const { test, assert, assertEqual } = TW.tests;
  const context = TW.application.context.createContext(TW.registry);
  const LEGACY_KEYS = ['incident', 'request', 'transfer', 'setup', 'setupPax', 'newDb', 'setupValor', 'setupTraining'];

  test('mọi key loại của bản cũ vẫn tồn tại (state/template lưu theo key)', () => {
    LEGACY_KEYS.forEach(key => assert(context.typeOf(key), `thiếu loại "${key}"`));
  });

  test('thứ tự Viết ticket: Hỗ trợ merchant, Chuyển case; Xử lý yêu cầu cũ mở bằng Hỗ trợ merchant', () => {
    assertEqual(context.tickets.map(t => t.key), ['incident', 'transfer']);
    assertEqual(context.typeOf('request').key, 'incident');
  });

  test('meta của mọi checklist khớp catalog', () => {
    context.setups.forEach(setup => {
      const { device, brand, flow, models } = setup.meta;
      const deviceDef = context.catalog.devices.find(d => d.id === device);
      assert(deviceDef, `${setup.key}: thiết bị "${device}" không có trong catalog`);
      const brandDef = deviceDef.brands.find(b => b.id === brand);
      assert(brandDef, `${setup.key}: hãng "${brand}" không có trong catalog`);
      assert(context.catalog.flows.some(f => f.id === flow), `${setup.key}: quy trình "${flow}" không có`);
      (models || []).forEach(m => assert(brandDef.models.includes(m), `${setup.key}: model "${m}" không có trong catalog`));
    });
  });

  test('id mục checklist duy nhất, mục nào cũng có id và text', () => {
    const ids = context.setups.flatMap(s => s.checklist.groups.flatMap(g => g.items.map(it => {
      assert(it.id && it.text, `${s.key}: mục thiếu id hoặc text`);
      return it.id;
    })));
    assertEqual(new Set(ids).size, ids.length);
  });

  test('registry chặn khai báo trùng key', () => {
    let error = null;
    try { TW.registry.addTicket('incident', { sections: [] }); } catch (e) { error = e; }
    assert(error, 'phải báo lỗi trùng key');
    error = null;
    try { TW.registry.addTicket('request', { sections: [] }); } catch (e) { error = e; }
    assert(error, 'không được dùng lại key loại cũ đã gộp');
  });
})(window.TW);
