import { getFormatter } from '../../utils/formatNumber';

export const HAN_NUMERALS = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
export const ARABIC_NUMERALS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
export const PERSIAN_NUMERALS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
export const FULLWIDTH_NUMERALS = ['０', '１', '２', '３', '４', '５', '６', '７', '８', '９'];

export const PERCENTAGES = ['%', '٪', '％', '﹪'];
export const PERMILLE = ['‰', '؉'];

export const UNICODE_MINUS_SIGNS = ['−', '－', '‒', '–', '—', '﹣'];
export const UNICODE_PLUS_SIGNS = ['＋', '﹢'];

// Fullwidth punctuation common in CJK inputs
export const FULLWIDTH_DECIMAL = '．'; // U+FF0E
export const FULLWIDTH_GROUP = '，'; // U+FF0C

export const ARABIC_RE = new RegExp(`[${ARABIC_NUMERALS.join('')}]`, 'g');
export const PERSIAN_RE = new RegExp(`[${PERSIAN_NUMERALS.join('')}]`, 'g');
export const FULLWIDTH_RE = new RegExp(`[${FULLWIDTH_NUMERALS.join('')}]`, 'g');
export const HAN_RE = new RegExp(`[${HAN_NUMERALS.join('')}]`, 'g');
export const PERCENT_RE = new RegExp(`[${PERCENTAGES.join('')}]`);
export const PERMILLE_RE = new RegExp(`[${PERMILLE.join('')}]`);

// Detection regexes (non-global to avoid lastIndex side effects)
const ARABIC_DETECT_RE = /[٠١٢٣٤٥٦٧٨٩]/;
const PERSIAN_DETECT_RE = /[۰۱۲۳۴۵۶۷۸۹]/;
const HAN_DETECT_RE = /[零一二三四五六七八九]/;

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const escapeClassChar = (s: string) => s.replace(/[-\\\]^]/g, (m) => `\\${m}`); // escape for use inside [...]

const charClassFrom = (chars: string[]) => `[${chars.map(escapeClassChar).join('')}]`;

export function getNumberLocaleDetails(
  locale?: Intl.LocalesArgument,
  options?: Intl.NumberFormatOptions,
) {
  const parts = getFormatter(locale, options).formatToParts(11111.1);
  const result: Partial<Record<Intl.NumberFormatPartTypes, string | undefined>> = {};

  parts.forEach((part) => {
    result[part.type] = part.value;
  });

  // The formatting options may result in not returning a decimal.
  getFormatter(locale)
    .formatToParts(0.1)
    .forEach((part) => {
      if (part.type === 'decimal') {
        result[part.type] = part.value;
      }
    });

  return result;
}

export function parseNumber(
  formattedNumber: string,
  locale?: Intl.LocalesArgument,
  options?: Intl.NumberFormatOptions,
) {
  if (formattedNumber == null) {
    return null;
  }

  // Normalize control characters and whitespace; remove bidi/format controls
  let input = String(formattedNumber)
    .replace(/\p{Cf}/gu, '')
    .trim();

  // "(...)" is negative
  let isParenthesizedNegative = false;
  if (/^\(\s*.+\s*\)$/.test(input)) {
    isParenthesizedNegative = true;
    input = input.slice(1, -1);
  }

  // Normalize unicode minus/plus to ASCII, handle leading/trailing signs
  const ANY_MINUS_RE = new RegExp(charClassFrom(['-'].concat(UNICODE_MINUS_SIGNS)), 'gu');
  const ANY_PLUS_RE = new RegExp(charClassFrom(['+'].concat(UNICODE_PLUS_SIGNS)), 'gu');
  input = input.replace(ANY_MINUS_RE, '-').replace(ANY_PLUS_RE, '+');

  let isNegative = isParenthesizedNegative;

  // Trailing sign, e.g. "1234-" / "1234+"
  const trailing = input.match(/([+-])\s*$/);
  if (trailing) {
    if (trailing[1] === '-') {
      isNegative = true;
    }
    input = input.replace(/([+-])\s*$/, '');
  }
  // Leading sign
  const leading = input.match(/^\s*([+-])/);
  if (leading) {
    if (leading[1] === '-') {
      isNegative = true;
    }
    input = input.replace(/^\s*[+-]/, '');
  }

  // Heuristic locale detection
  let computedLocale = locale;
  if (computedLocale === undefined) {
    if (ARABIC_DETECT_RE.test(input) || PERSIAN_DETECT_RE.test(input)) {
      computedLocale = 'ar';
    } else if (HAN_DETECT_RE.test(input)) {
      computedLocale = 'zh';
    }
  }

  const { group, decimal, currency } = getNumberLocaleDetails(computedLocale, options);

  // Build robust unit regex from all unit parts (such as "km/h")
  const unitParts = getFormatter(computedLocale, options)
    .formatToParts(1)
    .filter((p) => p.type === 'unit')
    .map((p) => escapeRegExp(p.value));
  const unitRegex = unitParts.length ? new RegExp(unitParts.join('|'), 'g') : null;

  let groupRegex: RegExp | null = null;
  if (group) {
    // Check if the group separator is a space-like character.
    // If so, we'll replace all such characters with an empty string.
    groupRegex = /\p{Zs}/u.test(group) ? /\p{Zs}/gu : new RegExp(escapeRegExp(group), 'g');
  }

  const replacements: Array<{
    regex: RegExp | null;
    replacement: string | ((m: string) => string);
  }> = [
    { regex: group ? groupRegex : null, replacement: '' },
    { regex: decimal ? new RegExp(escapeRegExp(decimal), 'g') : null, replacement: '.' },
    // Fullwidth punctuation
    { regex: /．/g, replacement: '.' }, // FULLWIDTH_DECIMAL
    { regex: /，/g, replacement: '' }, // FULLWIDTH_GROUP
    // Arabic punctuation
    { regex: /٫/g, replacement: '.' }, // ARABIC DECIMAL SEPARATOR (U+066B)
    { regex: /٬/g, replacement: '' }, // ARABIC THOUSANDS SEPARATOR (U+066C)
    // Currency & unit labels
    { regex: currency ? new RegExp(escapeRegExp(currency), 'g') : null, replacement: '' },
    { regex: unitRegex, replacement: '' },
    // Numeral systems to ASCII digits
    { regex: ARABIC_RE, replacement: (ch) => String(ARABIC_NUMERALS.indexOf(ch)) },
    { regex: PERSIAN_RE, replacement: (ch) => String(PERSIAN_NUMERALS.indexOf(ch)) },
    { regex: FULLWIDTH_RE, replacement: (ch) => String(FULLWIDTH_NUMERALS.indexOf(ch)) },
    { regex: HAN_RE, replacement: (ch) => String(HAN_NUMERALS.indexOf(ch)) },
  ];

  let unformatted = replacements.reduce((acc, { regex, replacement }) => {
    return regex ? acc.replace(regex, replacement as any) : acc;
  }, input);

  // Mixed-locale safety: keep only the last '.' as decimal
  const lastDot = unformatted.lastIndexOf('.');
  if (lastDot !== -1) {
    unformatted = `${unformatted.slice(0, lastDot).replace(/\./g, '')}.${unformatted.slice(lastDot + 1).replace(/\./g, '')}`;
  }

  // Guard against Infinity inputs (ASCII and symbol)
  if (/^[-+]?Infinity$/i.test(input) || /[∞]/.test(input)) {
    return null;
  }

  const parseTarget = (isNegative ? '-' : '') + unformatted;

  let num = parseFloat(parseTarget);

  const style = options?.style;
  const isUnitPercent = style === 'unit' && options?.unit === 'percent';
  const hasPercentSymbol = PERCENT_RE.test(formattedNumber) || style === 'percent';
  const hasPermilleSymbol = PERMILLE_RE.test(formattedNumber);

  if (!isUnitPercent && hasPercentSymbol) {
    num /= 100;
  } else if (hasPermilleSymbol) {
    num /= 1000;
  }

  if (Number.isNaN(num)) {
    return null;
  }

  return num;
}
