// src/application/pass-case-service.js — Các thao tác sửa form Chuyển case.
(function (TW) {
  'use strict';

  const { createEmptyPassCase, allPassCaseImageKeys } = TW.domain.passCase;

  /** @param {{ context: any, store: any, images: { clearKeys: (keys: string[]) => Promise<void> } }} deps */
  function createPassCaseService({ context, store, images }) {
    const config = context.passCase;

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
      reset() {
        images.clearKeys(allPassCaseImageKeys(config));
        store.update(state => { state.passCase = createEmptyPassCase(config); }, { rebuild: true });
      }
    };
  }

  TW.application.passCaseService = { createPassCaseService };
})(window.TW);
