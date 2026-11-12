// src/domain/qr-code.js — Mã QR (ISO 18004) cho link iPad: chế độ byte, mức sửa lỗi M, phiên bản 1–6 (tối đa 106 byte).
// Tự viết vì dự án không dùng thư viện. Link phone-upload chỉ ~45 ký tự nên 6 phiên bản là đủ, không cần version info (từ v7).
(function (TW) {
  'use strict';

  // Mức M, phiên bản 1–6: [số khối, số byte dữ liệu mỗi khối, số byte sửa lỗi mỗi khối] — các khối dài bằng nhau
  const BLOCKS = [null, [1, 16, 10], [1, 28, 16], [1, 44, 26], [2, 32, 18], [2, 43, 24], [4, 27, 16]];
  const ALIGNMENT = [null, [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34]];
  const MAX_VERSION = 6;
  const FORMAT_LEVEL_M = 0;
  const FORMAT_MASK = 0x5412;
  const FORMAT_POLY = 0x537;
  const GF_POLY = 0x11d;
  const BYTE_MODE = 0b0100;
  const PAD_BYTES = [0xec, 0x11];
  const FINDER_LIKE = /10111010000|00001011101/g;

  /** Nhân trong GF(256) */
  function gfMultiply(x, y) {
    let z = 0;
    for (let i = 7; i >= 0; i--) {
      z = (z << 1) ^ ((z >>> 7) * GF_POLY);
      z ^= ((y >>> i) & 1) * x;
    }
    return z;
  }

  function reedSolomon(data, degree) {
    const divisor = Array(degree).fill(0);
    divisor[degree - 1] = 1;
    let root = 1;
    for (let i = 0; i < degree; i++) {
      for (let j = 0; j < degree; j++) divisor[j] = gfMultiply(divisor[j], root) ^ (divisor[j + 1] || 0);
      root = gfMultiply(root, 2);
    }
    const remainder = Array(degree).fill(0);
    data.forEach(byte => {
      const factor = byte ^ remainder.shift();
      remainder.push(0);
      divisor.forEach((coefficient, i) => { remainder[i] ^= gfMultiply(coefficient, factor); });
    });
    return remainder;
  }

  /** Dữ liệu + byte sửa lỗi, xen kẽ giữa các khối như chuẩn yêu cầu */
  function buildCodewords(bytes, version) {
    const [blockCount, dataPerBlock, eccPerBlock] = BLOCKS[version];
    const capacityBits = blockCount * dataPerBlock * 8;
    const bits = [];
    const push = (value, length) => { for (let i = length - 1; i >= 0; i--) bits.push((value >>> i) & 1); };
    push(BYTE_MODE, 4);
    push(bytes.length, 8);
    bytes.forEach(byte => push(byte, 8));
    push(0, Math.min(4, capacityBits - bits.length));
    push(0, (8 - bits.length % 8) % 8);
    for (let i = 0; bits.length < capacityBits; i++) push(PAD_BYTES[i % 2], 8);
    const data = [];
    for (let i = 0; i < bits.length; i += 8) data.push(parseInt(bits.slice(i, i + 8).join(''), 2));
    const blocks = Array.from({ length: blockCount }, (_, b) => data.slice(b * dataPerBlock, (b + 1) * dataPerBlock));
    const eccBlocks = blocks.map(block => reedSolomon(block, eccPerBlock));
    const interleave = (list, length) => Array.from({ length }, (_, i) => list.map(block => block[i])).flat();
    return [...interleave(blocks, dataPerBlock), ...interleave(eccBlocks, eccPerBlock)];
  }

  function createGrid(size) {
    return { size, dark: Array.from({ length: size }, () => Array(size).fill(false)), reserved: Array.from({ length: size }, () => Array(size).fill(false)) };
  }

  const setFunction = (grid, x, y, isDark) => { grid.dark[y][x] = isDark; grid.reserved[y][x] = true; };

  /** Ô tìm vị trí 3 góc, vạch timing, ô căn chỉnh */
  function drawFunctionPatterns(grid, version) {
    const { size } = grid;
    for (let i = 0; i < size; i++) { setFunction(grid, 6, i, i % 2 === 0); setFunction(grid, i, 6, i % 2 === 0); }
    [[3, 3], [size - 4, 3], [3, size - 4]].forEach(([cx, cy]) => {
      for (let dy = -4; dy <= 4; dy++) {
        for (let dx = -4; dx <= 4; dx++) {
          const x = cx + dx; const y = cy + dy;
          const distance = Math.max(Math.abs(dx), Math.abs(dy));
          if (x >= 0 && x < size && y >= 0 && y < size) setFunction(grid, x, y, distance !== 2 && distance !== 4);
        }
      }
    });
    const positions = ALIGNMENT[version];
    const last = positions.length - 1;
    positions.forEach((cy, i) => positions.forEach((cx, j) => {
      if ((i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0)) return;   // trùng ô tìm vị trí
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) setFunction(grid, cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }));
    drawFormatBits(grid, 0);   // giữ chỗ; vẽ lại đúng mask sau
  }

  function drawFormatBits(grid, mask) {
    const { size } = grid;
    const data = (FORMAT_LEVEL_M << 3) | mask;
    let remainder = data;
    for (let i = 0; i < 10; i++) remainder = (remainder << 1) ^ ((remainder >>> 9) * FORMAT_POLY);
    const bits = ((data << 10) | remainder) ^ FORMAT_MASK;
    const bit = (i) => ((bits >>> i) & 1) === 1;
    for (let i = 0; i <= 5; i++) setFunction(grid, 8, i, bit(i));
    setFunction(grid, 8, 7, bit(6));
    setFunction(grid, 8, 8, bit(7));
    setFunction(grid, 7, 8, bit(8));
    for (let i = 9; i < 15; i++) setFunction(grid, 14 - i, 8, bit(i));
    for (let i = 0; i < 8; i++) setFunction(grid, size - 1 - i, 8, bit(i));
    for (let i = 8; i < 15; i++) setFunction(grid, 8, size - 15 + i, bit(i));
    setFunction(grid, 8, size - 8, true);   // ô tối cố định
  }

  /** Đặt dữ liệu theo đường zigzag từ góc phải dưới, từng cặp cột, bỏ cột timing 6 */
  function drawCodewords(grid, codewords) {
    const { size } = grid;
    let index = 0;
    for (let right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      const upward = ((right + 1) & 2) === 0;
      for (let step = 0; step < size; step++) {
        const y = upward ? size - 1 - step : step;
        for (const x of [right, right - 1]) {
          if (grid.reserved[y][x] || index >= codewords.length * 8) continue;
          grid.dark[y][x] = ((codewords[index >>> 3] >>> (7 - (index & 7))) & 1) === 1;
          index++;
        }
      }
    }
  }

  const MASKS = [
    (x, y) => (x + y) % 2 === 0, (x, y) => y % 2 === 0, (x) => x % 3 === 0, (x, y) => (x + y) % 3 === 0,
    (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0, (x, y) => (x * y) % 2 + (x * y) % 3 === 0,
    (x, y) => ((x * y) % 2 + (x * y) % 3) % 2 === 0, (x, y) => ((x + y) % 2 + (x * y) % 3) % 2 === 0
  ];

  function applyMask(grid, mask) {
    grid.dark.forEach((row, y) => row.forEach((isDark, x) => { if (!grid.reserved[y][x] && MASKS[mask](x, y)) row[x] = !isDark; }));
  }

  /** Điểm phạt của chuẩn (4 luật): mask điểm thấp nhất thì máy quét đọc dễ nhất */
  function penalty({ dark, size }) {
    const lines = [...dark, ...dark[0].map((_, x) => dark.map(row => row[x]))].map(line => line.map(Number).join(''));
    let score = 0;
    lines.forEach(line => {
      (line.match(/0{5,}|1{5,}/g) || []).forEach(run => { score += run.length - 2; });
      score += (line.match(FINDER_LIKE) || []).length * 40;
    });
    for (let y = 0; y < size - 1; y++) {
      for (let x = 0; x < size - 1; x++) {
        const color = dark[y][x];
        if (color === dark[y][x + 1] && color === dark[y + 1][x] && color === dark[y + 1][x + 1]) score += 3;
      }
    }
    const darkCount = dark.flat().filter(Boolean).length;
    return score + Math.floor(Math.abs(darkCount * 20 - size * size * 10) / (size * size)) * 10;
  }

  /**
   * @param {string} text
   * @returns {boolean[][] | null}   [hàng][cột], true = ô tối; null = quá dài (> phiên bản 6)
   */
  function encodeQr(text) {
    const bytes = [...new TextEncoder().encode(text)];
    let version = 1;
    while (version <= MAX_VERSION && 4 + 8 + bytes.length * 8 > BLOCKS[version][0] * BLOCKS[version][1] * 8) version++;
    if (version > MAX_VERSION) return null;
    const codewords = buildCodewords(bytes, version);
    let best = null;
    MASKS.forEach((_, mask) => {
      const grid = createGrid(17 + version * 4);
      drawFunctionPatterns(grid, version);
      drawCodewords(grid, codewords);
      applyMask(grid, mask);
      drawFormatBits(grid, mask);
      const score = penalty(grid);
      if (!best || score < best.score) best = { score, dark: grid.dark };
    });
    return best.dark;
  }

  TW.domain.qrCode = { encodeQr };
})(window.TW);
