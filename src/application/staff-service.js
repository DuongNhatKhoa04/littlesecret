// src/application/staff-service.js — Tên nhân viên: lưu riêng trên máy, giữ qua F5 và Ticket mới, chỉ đổi khi nhân viên tự sửa.
(function (TW) {
  'use strict';

  const { asString } = TW.domain.text;

  /** @param {{ context: object, storage: KeyValueStore }} deps */
  function createStaffService({ context, storage }) {
    const key = context.app.staffKey;
    let name = asString(storage.read(key));

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
