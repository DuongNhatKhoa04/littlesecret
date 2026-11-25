// src/application/pass-case-service.js — Các thao tác sửa form Chuyển case.
(function (TW) {
  'use strict';

  const { createEmptyPassCase, allPassCaseImageKeys, copyTicketFields, toTagName } = TW.domain.passCase;
  const { GROUPS } = TW.domain.navigation;
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
    /** Tag chỉnh tay của team đang chọn. */
    const updateTags = (mutate, change) => store.update(state => mutate(state.passCase.tags[state.passCase.team]), change);

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
      /** Nút ở form ticket: mở Chuyển case team fromTicket, mang theo Phone / Tên / Vai trò đã nhập để không gõ lại. */
      startFromTicket() {
        const { team, fields } = config.fromTicket;
        const passCaseType = context.tickets.find(type => type.passCase);
        store.update(state => {
          state.passCase.values = copyTicketFields(state.passCase.values, state.ticket, fields);
          state.passCase.team = team;
          state.nav.group = GROUPS.ticket;
          state.nav.ticketType = passCaseType.key;
        }, { rebuild: true });
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
      /** Bỏ tick = hôm nay người đó không đi làm. */
      setTagOn(name, on) {
        updateTags(tags => { tags.off = on ? without(tags.off, name) : [...without(tags.off, name), name]; }, {});
      },
      /** Thêm người support thêm cho team. Trả về false nếu chữ trống. */
      addTag(text) {
        const name = toTagName(text);
        if (!name) return false;
        tagHistory.forTeam(store.get().passCase.team).remember(name);
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
