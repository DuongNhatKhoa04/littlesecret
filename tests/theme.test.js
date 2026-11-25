// tests/theme.test.js — Nút giao diện: mặc định Tự động, bấm xoay vòng Tự động → Sáng → Tối, lưu riêng trên máy.
(function (TW) {
  'use strict';

  const { test, assertEqual } = TW.tests;
  const A = TW.application;
  const context = A.context.createContext(TW.registry);
  const key = context.app.themeKey;

  function fakeStorage(initial) {
    const data = { ...initial };
    return { data, read: (name) => name in data ? data[name] : null, write: (name, value) => { data[name] = value; return true; } };
  }

  test('giao diện: chưa chọn / giá trị lạ => Tự động', () => {
    assertEqual(A.themeService.createThemeService({ context, storage: fakeStorage({}) }).current().id, 'auto');
    assertEqual(A.themeService.createThemeService({ context, storage: fakeStorage({ [key]: 'tim' }) }).current().id, 'auto');
  });

  test('giao diện: bấm xoay vòng Tự động → Sáng → Tối → Tự động, lưu lựa chọn', () => {
    const storage = fakeStorage({});
    const theme = A.themeService.createThemeService({ context, storage });
    assertEqual([theme.cycle().id, theme.cycle().id, storage.data[key], theme.cycle().id], ['light', 'dark', 'dark', 'auto']);
  });

  test('giao diện: mở lại trang => giữ lựa chọn đã lưu', () => {
    assertEqual(A.themeService.createThemeService({ context, storage: fakeStorage({ [key]: 'dark' }) }).current(), { id: 'dark', label: 'Tối' });
  });
})(window.TW);
