import { BetRow, ParseResult } from '../types';

export function parseNumberTokens(str: string): string[] {
  return str
    .split(/[,.\-;\/\s]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && /^\d+$/.test(s));
}

export function parseSinglePrice(token: string, literal: boolean): number | null {
  const m = token.trim().match(/^(\d+(?:\.\d+)?)\s*(ລ້ານ|ແສນ)?$/);
  if (!m) return null;
  const num = parseFloat(m[1]);
  if (isNaN(num)) return null;
  if (m[2] === 'ລ້ານ') return num * 1000000;
  if (m[2] === 'ແສນ') return num * 100000;
  return literal ? num : num * 1000;
}

export function parsePriceExpr(expr: string, literal: boolean): number | null {
  const parts = expr
    .split(/[*xX]/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length === 0) return null;
  let total = 0;
  for (let i = 0; i < parts.length; i++) {
    const v = parseSinglePrice(parts[i], literal);
    if (v === null) return null;
    total += v;
  }
  return total;
}

const PRICE_MARKERS = ['ຮູລະ', 'ຮູ້', 'ຮູ', 'ຣຸ', 'ຣູ', '=', ':'];

function findPriceSplit(line: string): { left: string; right: string } | null {
  let earliestIdx = -1;
  let marker: string | null = null;
  for (let i = 0; i < PRICE_MARKERS.length; i++) {
    const mk = PRICE_MARKERS[i];
    const idx = line.indexOf(mk);
    if (idx !== -1 && (earliestIdx === -1 || idx < earliestIdx)) {
      earliestIdx = idx;
      marker = mk;
    }
  }
  if (earliestIdx === -1 || !marker) return null;
  return {
    left: line.slice(0, earliestIdx),
    right: line.slice(earliestIdx + marker.length),
  };
}

const PRICE_LEAD_RE =
  /^\s*(\d+(?:\.\d+)?\s*(?:ລ້ານ|ແສນ)?(?:\s*[*xX]\s*\d+(?:\.\d+)?\s*(?:ລ້ານ|ແສນ)?)*)/;

function computePriceFromRight(
  rightStr: string
): { value: number; note: string } | null {
  const leadMatch = rightStr.match(PRICE_LEAD_RE);
  if (!leadMatch) return null;
  const note = rightStr.slice(leadMatch[0].length);
  const literal = /^\s*(฿|ບາດ|บาท)/.test(note);
  const value = parsePriceExpr(leadMatch[1], literal);
  if (value === null) return null;
  return { value, note };
}

export function isBonLangText(text: string): boolean {
  const norm = text.replace(/[\s\-]/g, '');
  return (
    norm.indexOf('ບົນລ່າງ') !== -1 ||
    norm.indexOf('ບນລາງ') !== -1 ||
    norm.indexOf('ບລ') !== -1
  );
}

export function isStandaloneBonLangLine(line: string): boolean {
  const norm = line.replace(/[\s\-]/g, '');
  return norm === 'ບລ' || norm === 'ບົນລ່າງ' || norm === 'ບນລາງ';
}

const HAK_RE = /^\s*(ຫລັກ|ຫຼັກ)\s*/;

function nextNonBlankIsHak(lines: string[], fromIdx: number): boolean {
  for (let k = fromIdx; k < lines.length; k++) {
    const t = lines[k].trim();
    if (t.length === 0) continue;
    return HAK_RE.test(t);
  }
  return false;
}

interface InternalEntry {
  lineNo: number;
  raw: string;
  numbers: string[];
  unitValue: number;
  isBonLang: boolean;
  marker: boolean;
}

interface PendingBuffer {
  lineNo: number;
  numbers: string[];
  raw: string;
}

export function parseAll(text: string, bannedSet: Set<string>): ParseResult {
  const lines = text.split('\n');
  const entries: InternalEntry[] = [];
  const warnings: string[] = [];
  let pendingBuffer: PendingBuffer[] = [];
  let hakBase: string[] | null = null;

  function flushLeftoverWarning() {
    if (pendingBuffer.length > 0) {
      const lns = pendingBuffer.map((b) => b.lineNo).join(', ');
      warnings.push(`ແຖວ ${lns}: ມີຊຸດເລກແຕ່ບໍ່ພົບລາຄາ`);
      pendingBuffer = [];
    }
  }

  for (let idx = 0; idx < lines.length; idx++) {
    const rawLine = lines[idx];
    const lineNo = idx + 1;
    const line = rawLine.trim();

    if (line.length === 0) {
      if (!nextNonBlankIsHak(lines, idx + 1)) {
        flushLeftoverWarning();
      }
      continue;
    }

    if (isStandaloneBonLangLine(line)) {
      entries.push({
        lineNo,
        raw: rawLine,
        numbers: [],
        unitValue: 0,
        isBonLang: true,
        marker: true,
      });
      continue;
    }

    const hakMatch = line.match(HAK_RE);
    if (hakMatch) {
      const rest = line.slice(hakMatch[0].length);
      const hsplit = findPriceSplit(rest);
      if (!hsplit) {
        warnings.push(`ແຖວ ${lineNo}: ແຖວຫລັກອ່ານລາຄາບໍ່ໄດ້`);
        continue;
      }
      const prefixDigits = parseNumberTokens(hsplit.left);
      const hpriced = computePriceFromRight(hsplit.right);
      if (prefixDigits.length === 0 || !hpriced) {
        warnings.push(`ແຖວ ${lineNo}: ແຖວຫລັກຮູບແບບຜິດ`);
        continue;
      }

      if (pendingBuffer.length > 0) {
        let baseNums: string[] = [];
        for (let pb = 0; pb < pendingBuffer.length; pb++) {
          baseNums = baseNums.concat(pendingBuffer[pb].numbers);
        }
        pendingBuffer = [];
        hakBase = baseNums.filter((n) => n.length === 2);
      }

      if (!hakBase || hakBase.length === 0) {
        warnings.push(
          `ແຖວ ${lineNo}: ຫລັກ ບໍ່ພົບຊຸດເລກ 2 ໂຕ ໃຫ້ໃຊ້ (ໃສ່ຊຸດເລກ 2 ໂຕ ໄວ້ແຖວກ່ອນໜ້າກ່ອນ)`
        );
        continue;
      }

      const twoDigit = hakBase;
      const generated: string[] = [];
      for (let di = 0; di < prefixDigits.length; di++) {
        for (let ni = 0; ni < twoDigit.length; ni++) {
          generated.push(prefixDigits[di] + twoDigit[ni]);
        }
      }

      entries.push({
        lineNo,
        raw: rawLine,
        numbers: generated,
        unitValue: hpriced.value,
        isBonLang: isBonLangText(hpriced.note),
        marker: false,
      });
      continue;
    }

    const split = findPriceSplit(line);
    if (split) {
      const leftNumbers = parseNumberTokens(split.left);
      const priced = computePriceFromRight(split.right);
      if (!priced) {
        warnings.push(`ແຖວ ${lineNo}: ອ່ານລາຄາບໍ່ໄດ້`);
        continue;
      }

      let allNumbers: string[] = [];
      const rawParts: string[] = [];
      for (let bi = 0; bi < pendingBuffer.length; bi++) {
        allNumbers = allNumbers.concat(pendingBuffer[bi].numbers);
        rawParts.push(pendingBuffer[bi].raw);
      }
      pendingBuffer = [];

      allNumbers = allNumbers.concat(leftNumbers);
      rawParts.push(rawLine);

      if (allNumbers.length === 0) {
        warnings.push(`ແຖວ ${lineNo}: ພົບລາຄາແຕ່ບໍ່ມີຊຸດເລກ`);
        continue;
      }

      entries.push({
        lineNo,
        raw: rawParts.join(' / '),
        numbers: allNumbers,
        unitValue: priced.value,
        isBonLang: isBonLangText(priced.note),
        marker: false,
      });

      const newTwoDigit = allNumbers.filter((n) => n.length === 2);
      if (newTwoDigit.length > 0) hakBase = newTwoDigit;
    } else {
      const nums = parseNumberTokens(line);
      if (nums.length > 0) {
        pendingBuffer.push({ lineNo, numbers: nums, raw: rawLine });
      } else {
        warnings.push(`ແຖວ ${lineNo}: ອ່ານບໍ່ອອກ ("${line}")`);
      }
    }
  }

  flushLeftoverWarning();

  for (let i2 = 0; i2 < entries.length; i2++) {
    if (entries[i2].marker) {
      let expectedLine = entries[i2].lineNo - 1;
      for (let j = i2 - 1; j >= 0; j--) {
        if (entries[j].marker) break;
        if (entries[j].lineNo !== expectedLine) break;
        entries[j].isBonLang = true;
        expectedLine--;
      }
    }
  }

  const rows: BetRow[] = [];
  for (let e2 = 0; e2 < entries.length; e2++) {
    const e = entries[e2];
    if (e.marker) continue;
    for (let ni2 = 0; ni2 < e.numbers.length; ni2++) {
      const num = e.numbers[ni2];
      const occurrences = e.isBonLang && num.length === 2 ? 2 : 1;
      const banned = bannedSet.has(num);
      rows.push({
        number: num,
        lineNo: e.lineNo,
        raw: e.raw,
        unitValue: e.unitValue,
        occurrences,
        subtotal: e.unitValue * occurrences,
        banned,
      });
    }
  }

  return { rows, warnings };
}

export function formatKip(val: number): string {
  if (!isFinite(val)) val = 0;
  return Math.round(val).toLocaleString('en-US');
}
