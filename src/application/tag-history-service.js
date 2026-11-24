// src/application/tag-history-service.js — Tên tag đã thêm tay ở Chuyển case, lưu riêng từng team để gợi ý khi gõ ô Thêm tag.
(function (TW) {
  'use strict';

  const { toTagName, allTagIds } = TW.domain.passCase;
  const { createSummaryHistoryService } = TW.application.summaryHistoryService;

  /** @param {{ context: object, storage: KeyValueStore }} deps */
  function createTagHistoryService({ context, storage }) {
    const key = context.app.tagKey;
    const teamIds = allTagIds(context.passCase);   // gồm nhóm tag riêng của Assign
    const saved = storage.read(key);
    // v2026-11-24.14 lưu 1 danh sách chung, không biết tên thuộc team nào => mỗi team nhận 1 bản, người dùng × bớt tên không đúng team.
    const legacy = Array.isArray(saved) ? saved : null;
    const byTeam = legacy ? Object.fromEntries(context.passCase.teams.map(team => [team.id, legacy])) : (saved && typeof saved === 'object' ? { ...saved } : {});

    /** KeyValueStore của 1 team: ghi 1 team thì lưu lại cả object để không mất team khác. */
    const teamStorage = (id) => ({
      read: () => byTeam[id],
      write: (_, list) => { byTeam[id] = list; return storage.write(key, byTeam); }
    });
    const histories = Object.fromEntries(teamIds.map(id => [id, createSummaryHistoryService({ context, storage: teamStorage(id), key, normalize: toTagName })]));

    return { forTeam: (id) => histories[id] };
  }

  TW.application.tagHistoryService = { createTagHistoryService };
})(window.TW);
