// src/ui/review-form.js — Khu Nhập của SMS Xin review: Bang (gõ chữ viết tắt, gợi ý từ danh sách), Ngôn ngữ tin nhắn, Tên nhân viên.
(function (TW) {
  'use strict';

  const { el, choiceGroup, labeledField, textInput } = TW.ui.dom;
  const { findState, suggestStates } = TW.domain.review;

  const STATE_LIST_ID = 'review_states';
  const STATE_PLACEHOLDER = 'Chữ viết tắt của bang, vd TX';
  const STAFF_PLACEHOLDER = 'Nhập 1 lần, tự nhớ trên máy này';

  function createReviewForm({ root, context, session, reviewService, staffService }) {
    const { labels, languages } = context.review;
    let branchHint = null;
    let suggestions = null;

    const stateOption = (state) => Object.assign(el('option'), { value: state.code, label: state.name });

    function stateField() {
      const input = textInput({
        id: 'review_state', value: session.review().usState, placeholder: STATE_PLACEHOLDER,
        onInput: (value) => reviewService.setField('usState', value)
      });
      input.setAttribute('list', STATE_LIST_ID);
      branchHint = el('div', 'hint');
      branchHint.id = 'review_branch';
      suggestions = el('datalist');
      suggestions.id = STATE_LIST_ID;
      return labeledField(labels.state, input, suggestions, branchHint);
    }

    const languageField = () => labeledField(labels.language, choiceGroup({
      name: 'reviewLang', value: session.review().lang,
      options: languages.map(language => ({ value: language.id, label: language.label })),
      onChange: (lang) => reviewService.setField('lang', lang)
    }));

    // Không nằm trong state của form: Ticket mới không xóa, F5 vẫn còn.
    const staffField = () => labeledField(labels.staff,
      textInput({ id: 'review_staff', value: staffService.name(), placeholder: STAFF_PLACEHOLDER, onInput: staffService.setName }));

    /**
     * Hiện chi nhánh của bang đang nhập để biết link nào được dùng.
     * Tự lọc gợi ý theo chữ viết tắt: để Chrome lọc thì nó tìm cả trong tên bang (gõ b ra Nebraska).
     */
    function sync() {
      const { usState } = session.review();
      const state = findState(usState, context.review);
      branchHint.textContent = state ? `${labels.branch}: ${state.branch}` : '';
      suggestions.replaceChildren(...suggestStates(usState, context.review).map(stateOption));
    }

    function build() {
      root.textContent = '';
      root.append(stateField(), languageField(), staffField());
      sync();
    }

    return { build, sync };
  }

  TW.ui.reviewForm = { createReviewForm };
})(window.TW);
