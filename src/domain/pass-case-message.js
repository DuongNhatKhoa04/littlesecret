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
  const WORD_GAP = ' ';
  const DASH_GAP = ' - ';

  const joinFilled = (parts, gap = PART_GAP) => parts.filter(part => part).join(gap);

  /** Giá trị đã trim của các trường team đang dùng (trường team không dùng => trống), kèm các trường ghép {leadInfo}, {cbn}, {shopZip}, {caller} và {urgent} (chữ GẤP của team khi tick). */
  function teamValues(passCase, team) {
    const values = Object.fromEntries(team.fields.map(id => [id, passCase.values[id].trim()]));
    const person = values.contact && values.role ? `${values.contact} (${values.role})` : values.contact || values.role;
    return {
      ...values,
      leadInfo: joinFilled([values.shop, values.zip, values.mid]),
      cbn: joinFilled([values.phone, person]),
      shopZip: joinFilled([values.shop, values.zip], WORD_GAP),
      caller: joinFilled([values.phone, values.contact, values.role], DASH_GAP),
      urgent: team.urgent && passCase.urgent ? team.urgent : ''
    };
  }

  /** Dòng không có {…} (chữ cố định, dòng trống) luôn giữ. */
  function hasValue(line, values) {
    const names = [...line.matchAll(PLACEHOLDER)].map(([, name]) => name);
    return !names.length || names.some(name => values[name]);
  }

  /** Dòng trống ở đầu tin hoặc ngay sau dòng trống khác thì bỏ: dòng {…} bị bỏ không để lại 2 dòng trống. */
  const isKeptGap = (line, index, lines) => line !== '' || (index > 0 && lines[index - 1] !== '');

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

  /**
   * Người tag của team đang chọn: người ca đang trực (config) rồi tới người thêm tay (mọi ca), on = còn tick.
   * @param {{ passCase: object, config: object, now: Date }} input
   * @returns {{ name: string, on: boolean, extra: boolean }[]}
   */
  function passCaseTags({ passCase, config, now }) {
    const team = findTeam(passCase, config);
    const { off, extra } = passCase.tags[team.id];
    const minutes = localMinutes(now, config);
    const shift = (team.tags || []).filter(group => inShift(group, minutes)).flatMap(group => group.names);
    const added = extra.filter(name => !shift.includes(name));
    return [...shift, ...added].map(name => ({ name, on: !off.includes(name), extra: added.includes(name) }));
  }

  /** Many thanks team!, dòng dưới là người được tag (nếu có). */
  function closingLines(team, input) {
    const names = passCaseTags(input).filter(tag => tag.on).map(tag => tag.name);
    return [team.thanks || input.config.thanks, ...(names.length ? [names.join(TAG_GAP)] : [])];
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
    const lines = team.lines.filter(line => hasValue(line, values)).filter(isKeptGap).map(line => fillTemplate(line, values));
    return [...lines, ...closingLines(team, { passCase, config, now })].join('\n');
  }

  /** Nhãn các trường bắt buộc còn trống, theo thứ tự trên form. */
  function missingPassCaseFields({ passCase, config }) {
    const team = findTeam(passCase, config);
    return team.fields.filter(id => team.required.includes(id) && isBlank(passCase.values[id])).map(id => config.fields[id].label);
  }

  TW.domain.passCaseMessage = { buildPassCaseMessage, missingPassCaseFields, passCaseTags };
})(window.TW);
