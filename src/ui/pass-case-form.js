// src/ui/pass-case-form.js — Khu Nhập của Chuyển case: Team nhận, ô tick GẤP (Tech), các trường của team, lưu ý của team.
(function (TW) {
  'use strict';

  const { el, segmented, autoGrow, labeledField, textInput, maskPhone } = TW.ui.dom;
  const { findTeam, imageKey } = TW.domain.passCase;
  const REQUIRED_BADGE = 'Bắt buộc';
  const ID_PREFIX = 'pass_';

  function createPassCaseForm({ root, context, session, passCaseService, imageZone }) {
    const config = context.passCase;
    const { labels } = config;
    const value = (id) => session.passCase().values[id];
    const onInput = (id) => (text) => passCaseService.setValue(id, text);

    function withBadge(fieldNode, required) {
      if (required) fieldNode.querySelector('label').append(el('span', 'req', REQUIRED_BADGE));
      return fieldNode;
    }

    function multilineInput(id, field) {
      const textarea = el('textarea', 'text pass-multiline');
      Object.assign(textarea, { id: ID_PREFIX + id, rows: 2, value: value(id), placeholder: field.ph || '', spellcheck: false });
      textarea.addEventListener('input', () => { passCaseService.setValue(id, textarea.value); autoGrow(textarea); });
      requestAnimationFrame(() => autoGrow(textarea));
      return textarea;
    }

    /** Bấm lại lựa chọn đang chọn => bỏ chọn (vd Vai trò không rõ). */
    function choiceInput(id, field) {
      const options = field.options.map(option => ({ id: option, label: option }));
      const group = segmented({
        options, value: value(id), ariaLabel: field.label,
        onSelect: (option) => {
          const next = value(id) === option ? '' : option;
          passCaseService.setValue(id, next);
          group.querySelectorAll('button').forEach(node => node.setAttribute('aria-pressed', String(node.textContent === next)));
        }
      });
      return group;
    }

    function control(id, field) {
      if (field.kind === 'multiline') return multilineInput(id, field);
      if (field.kind === 'choice') return choiceInput(id, field);
      const phone = field.kind === 'phone';
      return textInput({
        id: ID_PREFIX + id, value: value(id), onInput: onInput(id), placeholder: field.ph,
        inputMode: phone ? 'tel' : field.inputMode, format: phone ? maskPhone : undefined
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

    function fieldNode(team, id) {
      const field = config.fields[id];
      const node = withBadge(labeledField(field.label, control(id, field)), team.required.includes(id));
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

    function urgentField() {
      const { urgent } = session.passCase();
      const toggle = el('label', 'pass-urgent');
      const box = el('input');
      Object.assign(box, { type: 'checkbox', checked: urgent });
      box.addEventListener('change', () => passCaseService.setUrgent(box.checked));
      toggle.append(box, el('b', '', labels.urgent));
      const wrap = el('div', 'field');
      wrap.append(toggle);
      return wrap;
    }

    function tipsNode(team) {
      const list = el('ul', 'pass-tips');
      team.tips.forEach(tip => list.append(el('li', '', tip)));
      return list;
    }

    function build() {
      const team = findTeam(session.passCase(), config);
      root.textContent = '';
      root.append(teamField(team));
      if (team.urgent) root.append(urgentField());
      root.append(...fieldNodes(team));
      if (team.tips) root.append(tipsNode(team));
    }

    // Ô nhập tự giữ giá trị khi gõ; đổi team / tick GẤP thì service yêu cầu dựng lại form.
    const sync = () => {};

    return { build, sync };
  }

  TW.ui.passCaseForm = { createPassCaseForm };
})(window.TW);
