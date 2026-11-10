// src/ui/review-form.js — Khu Nhập của SMS Xin review: Bang (gõ chữ viết tắt, gợi ý từ danh sách), Ngôn ngữ tin nhắn, Tên nhân viên.
(function (TW) {
  'use strict';

  const { el, choiceGroup } = TW.ui.dom;
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
      const wrap = el('div', 'field');
      const input = el('input', 'text');
      Object.assign(input, { id: 'review_state', type: 'text', value: session.review().usState, placeholder: STATE_PLACEHOLDER, autocomplete: 'off' });
      input.setAttribute('list', STATE_LIST_ID);
      input.addEventListener('input', () => reviewService.setField('usState', input.value));
      const label = el('label', '', labels.state);
      label.htmlFor = input.id;
      branchHint = el('div', 'hint');
      branchHint.id = 'review_branch';
      suggestions = el('datalist');
      suggestions.id = STATE_LIST_ID;
      wrap.append(label, input, suggestions, branchHint);
      return wrap;
    }

    function languageField() {
      const wrap = el('div', 'field');
      wrap.append(el('label', '', labels.language), choiceGroup({
        name: 'reviewLang', value: session.review().lang,
        options: languages.map(language => ({ value: language.id, label: language.label })),
        onChange: (lang) => reviewService.setField('lang', lang)
      }));
      return wrap;
    }

    // Không nằm trong state của form: Ticket mới không xóa, F5 vẫn còn.
    function staffField() {
      const wrap = el('div', 'field');
      const input = el('input', 'text');
      Object.assign(input, { id: 'review_staff', type: 'text', value: staffService.name(), placeholder: STAFF_PLACEHOLDER, autocomplete: 'off' });
      input.addEventListener('input', () => staffService.setName(input.value));
      const label = el('label', '', labels.staff);
      label.htmlFor = input.id;
      wrap.append(label, input);
      return wrap;
    }

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
