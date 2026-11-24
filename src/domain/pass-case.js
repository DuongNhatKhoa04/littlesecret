// src/domain/pass-case.js — Dữ liệu form Chuyển case: tạo mới, làm sạch dữ liệu đọc từ storage, team đang chọn.
(function (TW) {
  'use strict';

  function createEmptyPassCase(config) {
    const values = Object.fromEntries(Object.keys(config.fields).map(id => [id, '']));
    return { team: config.teams[0].id, urgent: false, assign: false, values, tags: emptyTags(config) };
  }

  /** Mỗi team 1 nhóm tag; team có biến thể assign thì thêm 1 nhóm riêng (tech supervisor chọn, không lẫn người support thêm). */
  const allTagIds = (config) => config.teams.flatMap(team => team.assign ? [team.id, team.assign.tagId] : [team.id]);

  /** Tag chỉnh tay theo nhóm tag: off = người ca này hôm nay nghỉ (bỏ tick), extra = người thêm vào (support thêm). */
  const emptyTags = (config) => Object.fromEntries(allTagIds(config).map(id => [id, { off: [], extra: [] }]));
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
    passCase.assign = raw.assign === true;
    passCase.tags = sanitizeTags(raw.tags, config);
    const saved = raw.values && typeof raw.values === 'object' ? raw.values : {};
    Object.keys(passCase.values).forEach(id => { if (typeof saved[id] === 'string') passCase.values[id] = saved[id]; });
    return passCase;
  }

  /**
   * Team đang chọn, đã áp biến thể assign khi tick Assign (trường, dòng tin, tag thay theo team.assign).
   * tagId: nhóm tag đang dùng (passCase.tags, gợi ý tên). Team giữ id gốc để ô Team nhận vẫn chọn đúng.
   */
  function findTeam(passCase, config) {
    const team = config.teams.find(item => item.id === passCase.team) || config.teams[0];
    if (passCase.assign && team.assign) return { ...team, ...team.assign, id: team.id, tagId: team.assign.tagId };
    return { ...team, tagId: team.id };
  }

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

  /** Tên tag gõ tay: bỏ khoảng trắng thừa, khoảng trắng giữa => _, thiếu @ thì thêm. Trống => ''. */
  const TAG_PREFIX = '@';
  function toTagName(text) {
    const name = text.trim().replace(/\s+/g, '_');
    return !name || name.startsWith(TAG_PREFIX) ? name : TAG_PREFIX + name;
  }

  TW.domain.passCase = { createEmptyPassCase, sanitizePassCase, findTeam, allTagIds, imageKey, passCaseImageSlots, allPassCaseImageKeys, toTagName };
})(window.TW);
