// src/domain/body.js — Ghép Nội dung ticket: Phone/Model, checklist, các mục, Kết luận, footer.
(function (TW) {
  'use strict';

  const { cleanItems, bulletize } = TW.domain.text;
  const { checkOf, itemLabel, isTouched } = TW.domain.checklist;
  const { isConclusionSection, findConclusion, isSectionHidden } = TW.domain.ticket;
  const BLOCK_GAP = '\n\n';

  function contactBlock({ type, ticket, model, app }) {
    const phone = [ticket.phone.trim(), ticket.merchant.trim()].filter(Boolean).join(' - ');   // (111) 111-1111 - Mr. Vương
    const lines = [];
    if (phone) lines.push(`${app.labels.phoneOut}: ${phone}` + (type.showLang && ticket.lang ? ` - ${ticket.lang}` : ''));
    if (model) lines.push(`${app.labels.modelOut}: ${model}`);
    return lines.join('\n');
  }

  function markOf(check, marks) {
    if (check.na) return marks.na;
    return check.done ? marks.done : marks.todo;
  }

  function checklistBlocks({ type, ticket, app }) {
    if (!type.checklist) return [];
    return type.checklist.groups.map(group => `${group.title}:\n` + group.items
      .map(item => `- ${markOf(checkOf(ticket.chk, item.id), app.marks)} ${itemLabel(item)}`)
      .join('\n'));
  }

  function sectionBlock(section, { ticket, app, sectionExtras = {} }) {
    if (isConclusionSection(section)) {
      const conclusion = findConclusion(app, ticket.conclusion);
      return conclusion && conclusion.showInBody ? `${section.label}: ${ticket.conclusion}` : '';
    }
    if (isSectionHidden(section, findConclusion(app, ticket.conclusion))) return '';
    const lines = cleanItems(ticket.blocks[section.key] || []).map(bulletize);
    if (sectionExtras[section.key]) lines.push(sectionExtras[section.key]);
    return lines.length ? `${section.label}:\n` + lines.join('\n') : '';
  }

  const hasSectionContent = (type, ticket) => type.sections
    .some(section => !isConclusionSection(section) && cleanItems(ticket.blocks[section.key] || []).length > 0);

  /** Chưa có Phone / Tên merchant, chưa đụng checklist, các mục đều trống => nội dung rỗng (không in footer). */
  function hasContent({ type, ticket, imageCounts, sectionExtras = {} }) {
    return !!ticket.phone.trim() || !!ticket.merchant.trim() || hasSectionContent(type, ticket) ||
      Object.values(sectionExtras).some(Boolean) || (!!type.checklist && isTouched(type.checklist, ticket.chk, imageCounts));
  }

  /**
   * sectionExtras: chữ in thêm cuối mục theo key, không gạch đầu dòng (vd chi tiết SMS Promotion cuối mục Đã support).
   * @param {{ type: object, ticket: object, imageCounts: Object<string, number>, model: string, app: object, sectionExtras?: Object<string, string> }} input
   * @returns {string}
   */
  function buildBody(input) {
    if (!hasContent(input)) return '';
    const sections = input.type.sections.map(section => sectionBlock(section, input));
    return [contactBlock(input), ...checklistBlocks(input), ...sections, input.type.footer]
      .filter(Boolean).join(BLOCK_GAP);
  }

  TW.domain.body = { buildBody };
})(window.TW);
