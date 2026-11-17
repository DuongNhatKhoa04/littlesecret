// src/domain/pass-case-message.js — Ghép tin nhắn Chuyển case theo team nhận và kiểm tra còn thiếu trường bắt buộc nào.
(function (TW) {
  'use strict';

  const { fillTemplate } = TW.domain.sms;
  const { findTeam } = TW.domain.passCase;
  const { isBlank } = TW.domain.text;
  const PLACEHOLDER = /\{(\w+)\}/g;
  const PART_GAP = ' – ';
  const MINUTES_PER_DAY = 24 * 60;
  const TAG_GAP = ' ';

  const joinFilled = (parts) => parts.filter(part => part).join(PART_GAP);

  /** Giá trị đã trim của các trường team đang dùng (trường team không dùng => trống), kèm 2 trường ghép {leadInfo}, {cbn}. */
  function teamValues(passCase, team) {
    const values = Object.fromEntries(team.fields.map(id => [id, passCase.values[id].trim()]));
    const person = values.contact && values.role ? `${values.contact} (${values.role})` : values.contact || values.role;
    return { ...values, leadInfo: joinFilled([values.shop, values.zip, values.mid]), cbn: joinFilled([values.phone, person]) };
  }

  const hasValue = (line, values) => [...line.matchAll(PLACEHOLDER)].some(([, name]) => values[name]);

  function urgentLines(passCase, team, config) {
    if (!team.urgent || !passCase.urgent) return [];
    const note = passCase.urgentNote.trim();
    return [note ? fillTemplate(config.urgentLine, { urgentNote: note }) : config.urgentOnly];
  }

  const toMinutes = (hhmm) => { const [hours, minutes] = hhmm.split(':').map(Number); return hours * 60 + minutes; };

  /** Phút trong ngày theo giờ VN (múi giờ trong config). */
  const localMinutes = (now, config) => (now.getUTCHours() * 60 + now.getUTCMinutes() + config.tagUtcOffsetMinutes) % MINUTES_PER_DAY;

  /** Nhóm tag không có from/to luôn dùng; có thì chỉ trong ca [from, to), from > to = ca qua đêm. */
  function inShift(group, minutes) {
    if (!group.from || !group.to) return true;
    const from = toMinutes(group.from);
    const to = toMinutes(group.to);
    return from <= to ? minutes >= from && minutes < to : minutes >= from || minutes < to;
  }

  /** Many thanks team!, dòng dưới là tag lead / sublead của ca đang trực (nếu có). */
  function closingLines(team, config, now) {
    const minutes = localMinutes(now, config);
    const names = (team.tags || []).filter(group => inShift(group, minutes)).flatMap(group => group.names);
    return [config.thanks, ...(names.length ? [names.join(TAG_GAP)] : [])];
  }

  /**
   * Chưa nhập trường nào của team đang chọn => rỗng. Dòng mà mọi chỗ {…} đều trống thì bỏ.
   * @param {{ passCase: object, config: object, now: Date }} input   now: chọn ca để tag
   * @returns {string}
   */
  function buildPassCaseMessage({ passCase, config, now }) {
    const team = findTeam(passCase, config);
    const values = teamValues(passCase, team);
    if (team.fields.every(id => !values[id])) return '';
    const lines = team.lines.filter(line => hasValue(line, values)).map(line => fillTemplate(line, values));
    return [...urgentLines(passCase, team, config), ...lines, ...closingLines(team, config, now)].join('\n');
  }

  /** Nhãn các trường bắt buộc còn trống, theo thứ tự trên form. */
  function missingPassCaseFields({ passCase, config }) {
    const team = findTeam(passCase, config);
    return team.fields.filter(id => team.required.includes(id) && isBlank(passCase.values[id])).map(id => config.fields[id].label);
  }

  TW.domain.passCaseMessage = { buildPassCaseMessage, missingPassCaseFields };
})(window.TW);
