// src/application/shipping-service.js — Các thao tác sửa form SMS Shipping.
(function (TW) {
  'use strict';

  const { FIELDS, createEmptyShipping } = TW.domain.shipping;

  function createShippingService({ store }) {
    return {
      setField(field, value) {
        if (!FIELDS.includes(field)) throw new Error(`Không sửa được trường "${field}"`);
        store.update(state => { state.shipping[field] = value; }, {});
      },
      reset() {
        store.update(state => { state.shipping = createEmptyShipping(); }, { rebuild: true });
      }
    };
  }

  TW.application.shippingService = { createShippingService };
})(window.TW);
