// src/application/pass-case-service.js — Các thao tác sửa form Chuyển case.
(function (TW) {
  'use strict';

  const { createEmptyPassCase, allPassCaseImageKeys, toTagName, findTeam } = TW.domain.passCase;
  const { sanitizeShopInfo } = TW.domain.shopInfo;
  const without = (list, name) => list.filter(item => item !== name);

  /** Ticket mới: bỏ người support thêm tay, giữ người chính theo ca và ô tick của họ. */
  const keepShiftTags = (tags) => Object.fromEntries(Object.entries(tags).map(([id, team]) => [id, { off: team.off, extra: [] }]));

  /**
   * @param {{ context: any, store: any, images: { clearKeys: (keys: string[]) => Promise<void> }, tagHistory: { forTeam: (team: string) => { remember: (text: string) => void } } }} deps
   *   tagHistory: tên đã thêm tay theo team, để gợi ý lần sau
   */
  function createPassCaseService({ context, store, images, tagHistory }) {
    const config = context.passCase;
    /** Nhóm tag đang dùng: team đang chọn, hoặc nhóm riêng của Assign khi đang tick. */
    const tagId = (passCase) => findTeam(passCase, config).tagId;
    /** Tag chỉnh tay của nhóm tag đang dùng. */
    const updateTags = (mutate, change) => store.update(state => mutate(state.passCase.tags[tagId(state.passCase)]), change);

    return {
      setValue(id, value) {
        if (!(id in config.fields)) throw new Error(`Không sửa được trường "${id}"`);
        store.update(state => { state.passCase.values[id] = value; }, {});
      },
      /**
       * Điền thông tin tiệm lấy từ trang Lead: ghi đè trường lấy được, trường không lấy được giữ nguyên.
       * Ô nhập tự giữ giá trị => không dựng lại form, UI tự đặt lại chữ trong ô. Trả về id các trường đã điền.
       */
      fillShopInfo(raw) {
        const info = sanitizeShopInfo(raw) || {};
        const ids = Object.keys(info).filter(id => id in config.fields);
        if (ids.length) store.update(state => { ids.forEach(id => { state.passCase.values[id] = info[id]; }); }, {});
        return ids;
      },
      /** Đổi team: các ô hiện trên form đổi theo => dựng lại form. */
      setTeam(team) {
        if (!config.teams.some(item => item.id === team)) return;
        store.update(state => { state.passCase.team = team; }, { rebuild: true });
      },
      /** Ô tick tự giữ trạng thái => không dựng lại form, con trỏ không bị mất. */
      setUrgent(on) {
        store.update(state => { state.passCase.urgent = on; }, {});
      },
      /** Assign (team có biến thể assign): đổi trường trên form => dựng lại form. Đổi team vẫn giữ tick. */
      setAssign(on) {
        store.update(state => { state.passCase.assign = on; }, { rebuild: true });
      },
      /** Bỏ tick = hôm nay người đó không đi làm. */
      setTagOn(name, on) {
        updateTags(tags => { tags.off = on ? without(tags.off, name) : [...without(tags.off, name), name]; }, {});
      },
      /** Thêm người support thêm cho team. Trả về false nếu chữ trống. */
      addTag(text) {
        const name = toTagName(text);
        if (!name) return false;
        tagHistory.forTeam(tagId(store.get().passCase)).remember(name);
        updateTags(tags => { tags.extra = [...without(tags.extra, name), name]; tags.off = without(tags.off, name); }, { rebuild: true });
        return true;
      },
      removeTag(name) {
        updateTags(tags => { tags.extra = without(tags.extra, name); tags.off = without(tags.off, name); }, { rebuild: true });
      },
      reset() {
        images.clearKeys(allPassCaseImageKeys(config));
        store.update(state => { state.passCase = { ...createEmptyPassCase(config), tags: keepShiftTags(state.passCase.tags) }; }, { rebuild: true });
      }
    };
  }

  TW.application.passCaseService = { createPassCaseService };
})(window.TW);
