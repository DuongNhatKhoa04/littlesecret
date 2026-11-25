// src/ui/pass-case-form.js — Khu Nhập của Chuyển case: Team nhận, ô tick GẤP (Tech), các trường của team, lưu ý của team.
(function (TW) {
  'use strict';

  const { el, button, segmented, toggleSegmented, autoGrow, labeledField, textInput, applyCase, maskPhone } = TW.ui.dom;
  const { capitalizeLines, capitalizeWords } = TW.domain.text;
  const { findTeam, imageKey, toTagName } = TW.domain.passCase;
  const { passCaseTags } = TW.domain.passCaseMessage;
  const { attachSuggestions } = TW.ui.combo;
  const { createShopPaste } = TW.ui.shopPaste;
  const REQUIRED_BADGE = 'Bắt buộc';
  const ID_PREFIX = 'pass_';
  const TAG_INPUT_ID = 'pass_tagAdd';
  const TAG_LIST_ID = 'pass_tagHistory';
  const CASE_TRANSFORMS = { words: capitalizeWords, lines: capitalizeLines };   // field.capitalize

  function createPassCaseForm({ root, context, session, passCaseService, imageZone, tagHistory, shopGrab }) {
    const config = context.passCase;
    const shopPaste = createShopPaste({ context, session, passCaseService, shopGrab, idPrefix: ID_PREFIX });
    const { labels } = config;
    const value = (id) => session.passCase().values[id];
    const onInput = (id) => (text) => passCaseService.setValue(id, text);
    /** Hàm viết hoa của trường (field.capitalize), tắt chung theo autoCapitalize như ô ticket. */
    const caseOf = (field) => (context.app.autoCapitalize ? CASE_TRANSFORMS[field.capitalize] : undefined);

    function withBadge(fieldNode, required) {
      if (required) fieldNode.querySelector('label').append(el('span', 'req', REQUIRED_BADGE));
      return fieldNode;
    }

    function multilineInput(id, field) {
      const textarea = el('textarea', 'text pass-multiline');
      Object.assign(textarea, { id: ID_PREFIX + id, rows: 2, value: value(id), placeholder: field.ph || '', spellcheck: false });
      const transform = caseOf(field);
      const commit = (format) => { passCaseService.setValue(id, format && transform ? applyCase(textarea, transform) : textarea.value); autoGrow(textarea); };
      textarea.addEventListener('input', (event) => commit(!event.isComposing));
      // Gõ dấu tiếng Việt xong mới viết hoa
      textarea.addEventListener('compositionend', () => setTimeout(() => commit(true), 0));
      requestAnimationFrame(() => autoGrow(textarea));
      return textarea;
    }

    /** Bấm lại lựa chọn đang chọn => bỏ chọn (vd Vai trò không rõ). */
    const choiceInput = (id, field) => toggleSegmented({ options: field.options, value: value(id), ariaLabel: field.label, onChange: onInput(id) });

    function control(id, field) {
      if (field.kind === 'multiline') return multilineInput(id, field);
      if (field.kind === 'choice') return choiceInput(id, field);
      const phone = field.kind === 'phone';
      const transform = caseOf(field);
      return textInput({
        id: ID_PREFIX + id, value: value(id), onInput: onInput(id), placeholder: field.ph,
        inputMode: phone ? 'tel' : field.inputMode, format: phone ? maskPhone : transform && ((input) => applyCase(input, transform))
      });
    }

    /** Trường có images: ô dán ảnh + Thêm ảnh + Chụp màn hình như mục ticket; Ctrl+V ảnh khi đang gõ trong ô cũng vào đây. */
    function withImages(node, id) {
      const key = imageKey(id);
      const [addImage, fileInput] = imageZone.addButton(key);
      const shot = imageZone.shotButton(key);
      shot.style.marginLeft = '8px';
      node.dataset.imgKey = key;
      node.append(imageZone.zone(key), addImage, shot, fileInput);
      imageZone.acceptDrop(node, key);
      return node;
    }

    /** Ô GẤP nằm ngay dưới ô nhiều dòng đầu tiên của team (Issue / Note): viết xong mô tả là tick luôn. */
    const urgentFieldId = (team) => team.urgent && team.fields.find(id => config.fields[id].kind === 'multiline');

    function fieldNode(team, id) {
      const field = config.fields[id];
      const input = control(id, field);
      const node = withBadge(labeledField(field.label, input), team.required.includes(id));
      if (id === urgentFieldId(team)) input.after(urgentToggle());
      return field.images ? withImages(node, id) : node;
    }

    function rowNode(team, ids) {
      const row = el('div', 'pass-row');
      row.append(...ids.map(id => fieldNode(team, id)));
      return row;
    }

    /** Trường cùng 1 hàng trong config.rows (vd Tên tiệm + ZIP) dựng chung 1 hàng, nếu team có từ 2 trường của hàng đó. */
    function fieldNodes(team) {
      const placed = new Set();
      const nodes = [];
      team.fields.forEach(id => {
        if (placed.has(id)) return;
        const row = (config.rows || []).find(ids => ids.includes(id));
        const ids = row ? row.filter(rowId => team.fields.includes(rowId)) : [id];
        ids.forEach(rowId => placed.add(rowId));
        nodes.push(ids.length > 1 ? rowNode(team, ids) : fieldNode(team, id));
      });
      return nodes;
    }

    const teamField = (team) => labeledField(labels.team,
      segmented({ options: config.teams, value: team.id, ariaLabel: labels.team, onSelect: passCaseService.setTeam }));

    function urgentToggle() {
      const toggle = el('label', 'pass-urgent');
      const box = el('input');
      Object.assign(box, { type: 'checkbox', checked: session.passCase().urgent });
      box.addEventListener('change', () => passCaseService.setUrgent(box.checked));
      toggle.append(box, el('b', '', labels.urgent));
      return toggle;
    }

    /** 1 người: ô tick (bỏ tick = hôm nay nghỉ); người thêm tay có thêm nút × để xóa khỏi danh sách. */
    function tagChip(tag) {
      const chip = el('label', 'chip pass-tag');
      const box = el('input');
      Object.assign(box, { type: 'checkbox', checked: tag.on });
      box.addEventListener('change', () => passCaseService.setTagOn(tag.name, box.checked));
      chip.append(box, el('span', '', tag.name));
      if (tag.extra) chip.append(button('', '×', { skipTab: true, ariaLabel: `${labels.tagRemove} ${tag.name}`, onClick: () => passCaseService.removeTag(tag.name) }));
      return chip;
    }

    /**
     * Thêm xong form dựng lại => focus lại ô thêm để nhập tiếp người khác.
     * Gợi ý: tên đã thêm tay trước đây ở team này, trừ người đang có trong danh sách tag; gõ thiếu @ vẫn ra.
     */
    function tagAdder(team, listed) {
      const input = textInput({ id: TAG_INPUT_ID, value: '', onInput: () => {}, placeholder: labels.tagPh });
      const add = (text) => { if (passCaseService.addTag(text)) document.getElementById(TAG_INPUT_ID).focus(); };
      input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !event.defaultPrevented) { event.preventDefault(); add(input.value); }   // defaultPrevented = vừa chọn gợi ý
      });
      const wrap = el('div', 'pass-tag-add');
      wrap.append(input, button('ghost', labels.tagAdd, { onClick: () => add(input.value) }));
      const history = tagHistory.forTeam(team.id);
      attachSuggestions({
        wrap, listId: TAG_LIST_ID, onPick: add, onForget: history.forget, toQuery: toTagName,
        items: () => history.list().filter(name => !listed.includes(name))
      });
      return wrap;
    }

    function tagsField(team) {
      const list = el('div', 'pass-tags');
      const tags = passCaseTags({ passCase: session.passCase(), config, now: new Date() });
      list.append(...tags.map(tagChip));
      return labeledField(labels.tags, list, tagAdder(team, tags.map(tag => tag.name)));
    }

    function tipsNode(team) {
      const list = el('ul', 'pass-tips');
      team.tips.forEach(tip => list.append(el('li', '', tip)));
      return list;
    }

    function build() {
      const team = findTeam(session.passCase(), config);
      root.textContent = '';
      root.append(teamField(team), shopPaste.node());
      root.append(...fieldNodes(team), tagsField(team));
      if (team.tips) root.append(tipsNode(team));
    }

    // Ô nhập tự giữ giá trị khi gõ; đổi team / tick GẤP thì service yêu cầu dựng lại form.
    const sync = () => {};

    return { build, sync };
  }

  TW.ui.passCaseForm = { createPassCaseForm };
})(window.TW);
