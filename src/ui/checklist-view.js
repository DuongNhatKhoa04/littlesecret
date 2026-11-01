// src/ui/checklist-view.js — Khối checklist: nhóm, mục (tick / N/A / ảnh), tiến độ. Cả khối cuộn trong 1 khung.
(function (TW) {
  'use strict';

  const { $, $$, el, link } = TW.ui.dom;
  const C = TW.domain.checklist;

  const HINT = 'Chụp ảnh xong, bấm "+ Thêm ảnh" ở mục cần gắn (hoặc bấm vào mục rồi Ctrl+V, hoặc kéo thả). Mục không áp dụng thì chọn N/A.';

  function statusText(status) {
    if (status.na) return 'Không áp dụng';
    if (!status.need) return 'Không cần ảnh';
    if (!status.missing) return `${status.have} ảnh`;
    return status.need > 1 ? `${status.have}/${status.need} ảnh, còn thiếu` : 'Thiếu ảnh';
  }

  function checkbox(role, onChange) {
    const input = el('input');
    input.type = 'checkbox';
    input.dataset.role = role;
    input.addEventListener('change', () => onChange(input.checked));
    return input;
  }

  function createChecklistView({ session, ticketService, images, imageZone }) {
    let root = null;
    let checklist = null;

    function itemDetails(item) {
      const nodes = [];
      if (item.sub && item.sub.length) {
        const list = el('ul', 'ci-sub');
        item.sub.forEach(text => list.append(el('li', '', text)));
        nodes.push(list);
      }
      if (item.warn) {
        const warn = el('div', 'ci-warn', item.warn);
        if (item.warnLink) warn.append(' ', link(item.warnLink));
        nodes.push(warn);
      }
      return nodes;
    }

    function itemRow(item) {
      const row = el('div', 'ci' + (item.parent ? ' child' : ''));
      row.tabIndex = -1;
      row.dataset.id = item.id;
      const done = el('label', 'ci-done');
      const text = el('span', 'ci-text', item.text);
      (item.links || []).forEach(l => text.append(' ', link(l)));
      done.append(checkbox('done', (checked) => ticketService.setDone(item.id, checked)), text);
      const na = el('label', 'ci-na');
      na.append(checkbox('na', (checked) => ticketService.setNa([item.id], checked)), el('span', '', 'N/A'));
      const top = el('div', 'ci-row');
      top.append(done, na);
      row.append(top, ...itemDetails(item));

      const tools = el('div', 'ci-tools');
      const state = el('span', 'ci-state');
      state.dataset.role = 'state';
      if (item.noImage) { tools.append(state); row.append(tools); return row; }   // mục không cần ảnh: chỉ có ô tick

      const key = C.imageKey(item.id);
      row.dataset.imgKey = key;
      tools.append(...imageZone.addButton(key), imageZone.shotButton(key), state);
      row.append(tools, imageZone.zone(key));
      imageZone.acceptDrop(row, key);
      return row;
    }

    function groupHeader(group, index) {
      const header = el('div', 'chk-group');
      const toggle = el('label', 'chk-gna');
      const all = el('input');
      all.type = 'checkbox';
      all.dataset.gna = index;
      all.addEventListener('change', () => ticketService.setNa(group.items.map(item => item.id), all.checked));
      toggle.append(all, el('span', '', 'N/A cả nhóm'));
      header.append(el('span', '', group.title), toggle);
      return header;
    }

    function build(type) {
      checklist = type.checklist;
      root = el('div', 'chk');
      const head = el('div', 'chk-head');
      const progressNode = el('span', 'status');
      progressNode.dataset.role = 'progress';
      head.append(el('span', '', checklist.title), progressNode);
      root.append(head, el('div', 'hint chk-hint', HINT));
      checklist.groups.forEach((group, index) => {
        root.append(groupHeader(group, index));
        let lastParent = null;
        group.items.forEach(item => {
          if (item.parent && item.parent !== lastParent) root.append(el('div', 'chk-parent', item.parent));
          lastParent = item.parent || null;
          root.append(itemRow(item));
        });
      });
      return root;   // gắn vào DOM xong thì gọi sync()
    }

    function syncItem(row, item, checks, counts) {
      const status = C.itemStatus(item, checks, counts);
      row.classList.toggle('na', status.na);
      row.classList.toggle('missing', status.missing);
      $('[data-role=done]', row).checked = status.done;
      $('[data-role=na]', row).checked = status.na;
      $('[data-role=state]', row).textContent = statusText(status);
    }

    /** Cập nhật tick / N/A / trạng thái ảnh mà không dựng lại DOM (giữ focus). */
    function sync() {
      if (!root || !root.isConnected) return;   // checklist không còn trên màn hình
      const checks = session.ticket().chk;
      const counts = images.counts();
      const items = new Map(C.allItems(checklist).map(item => [item.id, item]));
      checklist.groups.forEach((group, index) => { $(`[data-gna="${index}"]`, root).checked = C.isGroupAllNa(group, checks); });
      $$('.ci', root).forEach(row => syncItem(row, items.get(row.dataset.id), checks, counts));
      const p = C.progress(checklist, checks, counts);
      $('[data-role=progress]', root).textContent = `${p.ok}/${p.required} mục có ảnh` + (p.na ? ` · ${p.na} N/A` : '');
    }

    return { build, sync };
  }

  TW.ui.checklistView = { createChecklistView };
})(window.TW);
