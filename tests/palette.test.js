// tests/palette.test.js — Màu giao diện: mặc định Tím (mục đầu), chọn Hồng lưu riêng trên máy, id lạ bỏ qua.
(function (TW) {
  'use strict';

  const { test, assertEqual } = TW.tests;
  const A = TW.application;
  const context = A.context.createContext(TW.registry);
  const key = context.app.paletteKey;

  function fakeStorage(initial) {
    const data = { ...initial };
    return { data, read: (name) => name in data ? data[name] : null, write: (name, value) => { data[name] = value; return true; } };
  }
  const create = (initial) => A.paletteService.createPaletteService({ context, storage: fakeStorage(initial) });

  test('màu giao diện: chưa chọn / giá trị lạ => mục đầu (Tím, dùng tokens.css); có Hồng', () => {
    const service = create({});
    assertEqual([service.current().id, service.isDefault(service.current()), create({ [key]: 'xanh' }).current().id], ['castorice', true, 'castorice']);
    assertEqual(service.list().map(palette => palette.label), ['Tím', 'Hồng']);
  });

  test('màu giao diện: chọn Hồng lưu trên máy, mở lại vẫn Hồng; id lạ giữ màu đang dùng, không ghi', () => {
    const storage = fakeStorage({});
    const service = A.paletteService.createPaletteService({ context, storage });
    assertEqual([service.select('pink').id, storage.data[key], service.isDefault(service.current())], ['pink', 'pink', false]);
    assertEqual([service.select('nope').id, storage.data[key]], ['pink', 'pink']);
    assertEqual(A.paletteService.createPaletteService({ context, storage }).current().label, 'Hồng');
  });
})(window.TW);
