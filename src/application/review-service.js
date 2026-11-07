// src/application/review-service.js — Các thao tác sửa form SMS Xin review.
(function (TW) {
  'use strict';

  const { createEmptyReview } = TW.domain.review;
  const EDITABLE_FIELDS = ['usState', 'lang'];

  function createReviewService({ context, store }) {
    return {
      setField(field, value) {
        if (!EDITABLE_FIELDS.includes(field)) throw new Error(`Không sửa được trường "${field}"`);
        store.update(state => { state.review[field] = value; }, {});
      },
      reset() {
        store.update(state => { state.review = createEmptyReview(context.review); }, { rebuild: true });
      }
    };
  }

  TW.application.reviewService = { createReviewService };
})(window.TW);
