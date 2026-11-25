// src/domain/pass-case.js — Dữ liệu form Chuyển case: tạo mới, làm sạch dữ liệu đọc từ storage, team đang chọn.
(function (TW) {
  'use strict';

  /** Team mở sẵn: defaultTeam của config, không có / sai id thì team đầu. */
  const defaultTeam = (config) => config.teams.find(team => team.id === config.defaultTeam) || config.teams[0];

  /** Nút chọn nhanh (switches): option đầu là mặc định. */
  const defaultSwitches = (config) => Object.fromEntries(Object.entries(config.switches).map(([id, item]) => [id, item.options[0].id]));
  const findOption = (passCase, config, switchId) =>
    config.switches[switchId].options.find(option => option.id === passCase[switchId]) || config.switches[switchId].options[0];

  function createEmptyPassCase(config) {
    const values = Object.fromEntries(Object.keys(config.fields).map(id => [id, '']));
    return { team: defaultTeam(config).id, urgent: false, ...defaultSwitches(config), values, tags: emptyTags(config) };
  }

  /** Tag chỉnh tay theo team: off = người ca này hôm nay nghỉ (bỏ tick), extra = người thêm vào (support thêm). */
  const emptyTags = (config) => Object.fromEntries(config.teams.map(team => [team.id, { off: [], extra: [] }]));
  const stringList = (raw) => Array.isArray(raw) ? raw.filter(item => typeof item === 'string') : [];

  function sanitizeTags(raw, config) {
    const tags = emptyTags(config);
    if (!raw || typeof raw !== 'object') return tags;
    Object.keys(tags).forEach(id => { const saved = raw[id] || {}; tags[id] = { off: stringList(saved.off), extra: stringList(saved.extra) }; });
    return tags;
  }

  /** Team / trường không còn trong config thì bỏ; bản trước chưa có pass case => mặc định. */
  function sanitizePassCase(raw, config) {
    const passCase = createEmptyPassCase(config);
    if (!raw || typeof raw !== 'object') return passCase;
    if (config.teams.some(team => team.id === raw.team)) passCase.team = raw.team;
    passCase.urgent = raw.urgent === true;
    Object.keys(config.switches).forEach(id => { passCase[id] = findOption(raw, config, id).id; });
    passCase.tags = sanitizeTags(raw.tags, config);
    const saved = raw.values && typeof raw.values === 'object' ? raw.values : {};
    Object.keys(passCase.values).forEach(id => { if (typeof saved[id] === 'string') passCase.values[id] = saved[id]; });
    return passCase;
  }

  const findTeam = (passCase, config) => config.teams.find(team => team.id === passCase.team) || defaultTeam(config);

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

  /**
   * Lấy trường từ ticket sang Chuyển case. Ô ticket trống thì giữ chữ đang có ở Chuyển case.
   * @param {Record<string, string>} values   giá trị Chuyển case hiện tại
   * @param {Record<string, string>} ticket
   * @param {Record<string, string>} fields   key ticket -> id trường Chuyển case
   */
  function copyTicketFields(values, ticket, fields) {
    const copied = Object.entries(fields).filter(([from]) => typeof ticket[from] === 'string' && ticket[from].trim())
      .map(([from, to]) => [to, ticket[from].trim()]);
    return { ...values, ...Object.fromEntries(copied) };
  }

  /** Tên tag gõ tay: bỏ khoảng trắng thừa, khoảng trắng giữa => _, thiếu @ thì thêm. Trống => ''. */
  const TAG_PREFIX = '@';
  function toTagName(text) {
    const name = text.trim().replace(/\s+/g, '_');
    return !name || name.startsWith(TAG_PREFIX) ? name : TAG_PREFIX + name;
  }

  TW.domain.passCase = { createEmptyPassCase, sanitizePassCase, findTeam, findOption, imageKey, passCaseImageSlots, allPassCaseImageKeys, copyTicketFields, toTagName };
})(window.TW);
