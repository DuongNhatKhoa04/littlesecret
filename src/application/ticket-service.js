// src/application/ticket-service.js — Các thao tác sửa ticket đang nhập.
(function (TW) {
  'use strict';

  const { createEmptyTicket } = TW.domain.ticket;
  const { joinCategories } = TW.domain.title;
  const { checkOf } = TW.domain.checklist;
  const EDITABLE_FIELDS = ['category', 'summary', 'phone', 'merchant', 'lang'];

  function createTicketService({ context, store }) {
    const edit = (mutate, change) => store.update(state => mutate(state.ticket), change || {});
    const rebuildAt = (key, index) => ({ rebuild: true, focus: { key, index } });
    const setCheck = (ticket, itemId, patch) => { ticket.chk[itemId] = { ...checkOf(ticket.chk, itemId), ...patch }; };

    return {
      setField(field, value) {
        if (!EDITABLE_FIELDS.includes(field)) throw new Error(`Không sửa được trường "${field}"`);
        edit(ticket => { ticket[field] = value; });
      },
      setCategories(tags) { edit(ticket => { ticket.category = joinCategories(tags); }); },
      setConclusion(value) { edit(ticket => { ticket.conclusion = value; }); },

      setIdea(key, index, text) { edit(ticket => { ticket.blocks[key][index] = text; }); },
      insertIdea(key, index) { edit(ticket => { ticket.blocks[key].splice(index, 0, ''); }, rebuildAt(key, index)); },
      appendIdea(key) {
        const index = store.get().ticket.blocks[key].length;
        edit(ticket => { ticket.blocks[key].push(''); }, rebuildAt(key, index));
      },
      removeIdea(key, index) {
        edit(ticket => { ticket.blocks[key].splice(index, 1); }, rebuildAt(key, Math.max(0, index - 1)));
      },
      /** Nút ×: còn 1 ý thì làm trống thay vì xóa. */
      clearIdea(key, index) {
        edit(ticket => {
          const ideas = ticket.blocks[key];
          if (ideas.length === 1) ideas[0] = ''; else ideas.splice(index, 1);
        }, rebuildAt(key, Math.max(0, index - 1)));
      },
      moveIdea(key, from, to) {
        if (to < 0 || to >= store.get().ticket.blocks[key].length) return;
        edit(ticket => {
          const ideas = ticket.blocks[key];
          [ideas[from], ideas[to]] = [ideas[to], ideas[from]];
        }, rebuildAt(key, to));
      },

      setDone(itemId, done) { edit(ticket => setCheck(ticket, itemId, { done })); },
      setNa(itemIds, na) { edit(ticket => itemIds.forEach(id => setCheck(ticket, id, { na }))); },
      /** Có ảnh => coi như đã làm xong bước đó. */
      markDoneByImage(itemId) { edit(ticket => setCheck(ticket, itemId, { done: true, na: false })); },

      reset() {
        store.update(state => { state.ticket = createEmptyTicket(context); }, { rebuild: true });
      }
    };
  }

  TW.application.ticketService = { createTicketService };
})(window.TW);
