// src/application/pass-case-service.js — Các thao tác sửa form Chuyển case.
(function (TW) {
  'use strict';

  const { createEmptyPassCase, allPassCaseImageKeys, toTagName } = TW.domain.passCase;
  const without = (list, name) => list.filter(item => item !== name);

  /** @param {{ context: any, store: any, images: { clearKeys: (keys: string[]) => Promise<void> } }} deps */
  function createPassCaseService({ context, store, images }) {
    const config = context.passCase;
    /** Tag chỉnh tay của team đang chọn. */
    const updateTags = (mutate, change) => store.update(state => mutate(state.passCase.tags[state.passCase.team]), change);

    return {
      setValue(id, value) {
        if (!(id in config.fields)) throw new Error(`Không sửa được trường "${id}"`);
        store.update(state => { state.passCase.values[id] = value; }, {});
      },
      /** Đổi team: các ô hiện trên form đổi theo => dựng lại form. */
      setTeam(team) {
        if (!config.teams.some(item => item.id === team)) return;
        store.update(state => { state.passCase.team = team; }, { rebuild: true });
      },
      setUrgent(on) {
        store.update(state => { state.passCase.urgent = on; }, { rebuild: true });
      },
      /** Bỏ tick = hôm nay người đó không đi làm. */
      setTagOn(name, on) {
        updateTags(tags => { tags.off = on ? without(tags.off, name) : [...without(tags.off, name), name]; }, {});
      },
      /** Thêm người support thêm cho team. Trả về false nếu chữ trống. */
      addTag(text) {
        const name = toTagName(text);
        if (!name) return false;
        updateTags(tags => { tags.extra = [...without(tags.extra, name), name]; tags.off = without(tags.off, name); }, { rebuild: true });
        return true;
      },
      removeTag(name) {
        updateTags(tags => { tags.extra = without(tags.extra, name); tags.off = without(tags.off, name); }, { rebuild: true });
      },
      /** Danh sách tag là người đi làm, không phải nội dung case => Ticket mới giữ lại. */
      reset() {
        images.clearKeys(allPassCaseImageKeys(config));
        store.update(state => { state.passCase = { ...createEmptyPassCase(config), tags: state.passCase.tags }; }, { rebuild: true });
      }
    };
  }

  TW.application.passCaseService = { createPassCaseService };
})(window.TW);
