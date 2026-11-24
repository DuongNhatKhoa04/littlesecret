// src/domain/pass-case.js — Dữ liệu form Chuyển case: tạo mới, làm sạch dữ liệu đọc từ storage, team đang chọn.
(function (TW) {
  'use strict';

  function createEmptyPassCase(config) {
    const values = Object.fromEntries(Object.keys(config.fields).map(id => [id, '']));
    return { team: config.teams[0].id, urgent: false, values };
  }

  /** Team / trường không còn trong config thì bỏ; bản trước chưa có pass case => mặc định. */
  function sanitizePassCase(raw, config) {
    const passCase = createEmptyPassCase(config);
    if (!raw || typeof raw !== 'object') return passCase;
    if (config.teams.some(team => team.id === raw.team)) passCase.team = raw.team;
    passCase.urgent = raw.urgent === true;
    const saved = raw.values && typeof raw.values === 'object' ? raw.values : {};
    Object.keys(passCase.values).forEach(id => { if (typeof saved[id] === 'string') passCase.values[id] = saved[id]; });
    return passCase;
  }

  const findTeam = (passCase, config) => config.teams.find(team => team.id === passCase.team) || config.teams[0];

  // Ảnh lưu chung kho với ảnh ticket nên cần tiền tố riêng để không trùng key mục ticket. Key lưu trong IndexedDB => không đổi.
  const IMAGE_KEY_PREFIX = 'pass:';
  const imageKey = (fieldId) => IMAGE_KEY_PREFIX + fieldId;

  /** Chỗ gắn ảnh của team đang chọn: các trường có images, theo thứ tự trên form. */
  function passCaseImageSlots(passCase, config) {
    return findTeam(passCase, config).fields
      .filter(id => config.fields[id].images)
      .map(id => ({ key: imageKey(id), label: config.fields[id].label }));
  }

  /** Key ảnh của mọi trường có images (mọi team), để Ticket mới xóa hết ảnh Chuyển case. */
  const allPassCaseImageKeys = (config) => Object.keys(config.fields).filter(id => config.fields[id].images).map(imageKey);

  TW.domain.passCase = { createEmptyPassCase, sanitizePassCase, findTeam, imageKey, passCaseImageSlots, allPassCaseImageKeys };
})(window.TW);
