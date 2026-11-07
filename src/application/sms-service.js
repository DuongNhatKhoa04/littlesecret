// src/application/sms-service.js — Các thao tác sửa form SMS Promotion.
(function (TW) {
  'use strict';

  const { createEmptySms } = TW.domain.sms;
  const EDITABLE_FIELDS = ['lang', 'shop', 'shopPhone', 'recipients', 'message', 'price'];
  const OPTION_FOCUS_KEY = 'smsOption';   // focus.key khi dựng lại form sau khi thêm/xóa option

  function createSmsService({ context, store }) {
    const edit = (mutate, change) => store.update(state => mutate(state.sms), change || {});
    const rebuildAt = (index) => ({ rebuild: true, focus: { key: OPTION_FOCUS_KEY, index } });

    return {
      setField(field, value) {
        if (!EDITABLE_FIELDS.includes(field)) throw new Error(`Không sửa được trường "${field}"`);
        edit(sms => { sms[field] = value; });
      },
      setEnabled(on) { edit(sms => { sms.enabled = on; }); },
      setCustomerType(id, on) { edit(sms => { sms.customerTypes[id].on = on; }); },
      setCustomerValue(id, name, value) { edit(sms => { sms.customerTypes[id].values[name] = value; }); },

      /** Option tự thêm của Type Customer (ngoài các mục có sẵn trong config). */
      setOption(index, text) { edit(sms => { sms.customOptions[index] = text; }); },
      insertOption(index) { edit(sms => { sms.customOptions.splice(index, 0, ''); }, rebuildAt(index)); },
      removeOption(index) { edit(sms => { sms.customOptions.splice(index, 1); }, rebuildAt(Math.max(0, index - 1))); },
      reset() {
        store.update(state => { state.sms = createEmptySms(context.sms); }, { rebuild: true });
      }
    };
  }

  TW.application.smsService = { createSmsService, OPTION_FOCUS_KEY };
})(window.TW);
