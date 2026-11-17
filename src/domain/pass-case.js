// src/domain/pass-case.js — Dữ liệu form Chuyển case: tạo mới, làm sạch dữ liệu đọc từ storage, team đang chọn.
(function (TW) {
  'use strict';

  function createEmptyPassCase(config) {
    const values = Object.fromEntries(Object.keys(config.fields).map(id => [id, '']));
    return { team: config.teams[0].id, urgent: false, urgentNote: '', values };
  }

  /** Team / trường không còn trong config thì bỏ; bản trước chưa có pass case => mặc định. */
  function sanitizePassCase(raw, config) {
    const passCase = createEmptyPassCase(config);
    if (!raw || typeof raw !== 'object') return passCase;
    if (config.teams.some(team => team.id === raw.team)) passCase.team = raw.team;
    passCase.urgent = raw.urgent === true;
    if (typeof raw.urgentNote === 'string') passCase.urgentNote = raw.urgentNote;
    const saved = raw.values && typeof raw.values === 'object' ? raw.values : {};
    Object.keys(passCase.values).forEach(id => { if (typeof saved[id] === 'string') passCase.values[id] = saved[id]; });
    return passCase;
  }

  const findTeam = (passCase, config) => config.teams.find(team => team.id === passCase.team) || config.teams[0];

  TW.domain.passCase = { createEmptyPassCase, sanitizePassCase, findTeam };
})(window.TW);
