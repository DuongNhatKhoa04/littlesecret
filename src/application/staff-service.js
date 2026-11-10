// src/application/staff-service.js — Tên nhân viên: lưu riêng trên máy, giữ qua F5 và Ticket mới, chỉ đổi khi nhân viên tự sửa.
(function (TW) {
  'use strict';

  /** @param {{ context: object, storage: KeyValueStore }} deps */
  function createStaffService({ context, storage }) {
    const key = context.app.staffKey;
    const saved = storage.read(key);
    let name = typeof saved === 'string' ? saved : '';

    return {
      name: () => name,
      setName(value) {
        name = value;
        storage.write(key, name);
      }
    };
  }

  TW.application.staffService = { createStaffService };
})(window.TW);
