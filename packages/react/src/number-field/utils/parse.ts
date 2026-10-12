import { getFormatter } from '@base-ui/utils/formatNumber';

// Han numerals in digit order, with both zero forms first ('零' at 0, '〇' at 1), so a
// character's digit value is `max(indexOf - 1, 0)`.
const HAN_NUMERALS = '零〇一二三四五六七八九';

// Arabic-Indic (U+0660–0669), Persian (U+06F0–06F9), and fullwidth (U+FF10–FF19) digits are
// contiguous ranges whose bases are divisible by 16, so `charCode % 16` is the digit value for
// all three systems.
const NON_ASCII_DIGIT_RE = /[٠-٩۰-۹０-９]/;

export const PERCENTAGES = ['%', '٪', '％', '﹪'];
export const PERMILLE = ['‰', '؉'];

// Fullwidth punctuation common in CJK inputs
export const FULLWIDTH_DECIMAL = '．'; // U+FF0E
export const FULLWIDTH_GROUP = '，'; // U+FF0C

export const PERCENT_RE = /[%٪％﹪]/;
export const PERMILLE_RE = /[‰؉]/;

// Detection regexes (non-global to avoid lastIndex side effects). Arabic-Indic and Persian
// digits share one regex because both resolve to the `ar` locale heuristic.
export const ARABIC_PERSIAN_DETECT_RE = /[٠-٩۰-۹]/;
export const HAN_DETECT_RE = /[零〇一二三四五六七八九]/;

const ANY_NUMERAL_DETECT_RE = /[0-9٠-٩۰-۹０-９零〇一二三四五六七八九]/;

// Whether the character is a digit in any numeral system the field accepts.
export function isNumeralChar(char: string) {
  return ANY_NUMERAL_DETECT_RE.test(char);
}

export const BASE_NON_NUMERIC_SYMBOLS = [
  '.',
  ',',
  FULLWIDTH_DECIMAL,
  FULLWIDTH_GROUP,
  '٫',
  '٬',
] as const;
export const SPACE_SEPARATOR_RE = /\p{Zs}/u;
// Format/bidi control characters (e.g. the LRM/ALM marks RTL locales insert around exponent and
// currency signs). `parseNumber` strips these, so input validation must treat them as ignorable
// rather than rejecting the typed string. Non-global so it's safe for repeated `.test(char)`.
export const FORMAT_CONTROL_DETECT_RE = /\p{Cf}/u;
const FORMAT_CONTROL_GLOBAL_RE = /\p{Cf}/gu;
export const PLUS_SIGNS_WITH_ASCII = ['+', '＋', '﹢'];
export const MINUS_SIGNS_WITH_ASCII = ['-', '−', '－', '‒', '–', '—', '﹣'];

function shiftDecimal(value: number, exponentDelta: number) {
  const [coefficient, exponent = '0'] = String(value).split('e');
  return Number(`${coefficient}e${Number(exponent) + exponentDelta}`);
}

export const ANY_MINUS_RE = /[-−－‒–—﹣]/gu;
export const ANY_PLUS_RE = /[+＋﹢]/gu;
export const ANY_MINUS_DETECT_RE = /[-−－‒–—﹣]/;
export const ANY_PLUS_DETECT_RE = /[+＋﹢]/;

// A representative value with a grouping separator and a fractional part, so that the formatter
// emits every locale-specific part (group, decimal, currency, unit, literal, exponent, …). Shared
// so the locale-detail and allowed-character derivations enumerate the same parts.
const SAMPLE_FORMAT_NUMBER = 11111.1;

/**
 * Returns the `Intl.NumberFormat` parts of a representative number, which surface every
 * non-numeric symbol a given locale/format renders.
 */
export function getFormatParts(locale?: Intl.LocalesArgument, options?: Intl.NumberFormatOptions) {
  return getFormatter(locale, options).formatToParts(SAMPLE_FORMAT_NUMBER);
}

export function getNumberLocaleDetails(
  locale?: Intl.LocalesArgument,
  options?: Intl.NumberFormatOptions,
) {
  const parts = getFormatParts(locale, options);
  const result: Partial<Record<Intl.NumberFormatPartTypes, string | undefined>> = {};

  parts.forEach((part) => {
    result[part.type] = part.value;
  });

  // The formatting options may omit the decimal separator (e.g. integer formats), so resolve it
  // from the plain locale formatter, which renders one for every locale and numbering system. This
  // overrides any options-derived decimal too, which is safe because the separator is
  // locale-determined and identical across format styles. The ASCII seed is a formality to keep
  // the separator non-optional for callers; it is always replaced below.
  let decimal = '.';
  getFormatter(locale)
    .formatToParts(0.1)
    .forEach((part) => {
      if (part.type === 'decimal') {
        decimal = part.value;
      }
    });

  return { ...result, decimal };
}

// The digits 0–9 of the formatter's numbering system, such as `০`–`৯` for bn-BD.
export function getLocaleDigits(locale?: Intl.LocalesArgument, options?: Intl.NumberFormatOptions) {
  const { numberingSystem } = getFormatter(locale, options).resolvedOptions();
  return Array.from(
    getFormatter(locale, { numberingSystem, useGrouping: false }).format(9876543210),
  ).reverse();
}

export function parseNumber(
  formattedNumber: string,
  locale?: Intl.LocalesArgument,
  options?: Intl.NumberFormatOptions,
) {
  // Normalize control characters and whitespace; remove bidi/format controls
  let input = formattedNumber.replace(FORMAT_CONTROL_GLOBAL_RE, '').trim();

  // Heuristic locale detection
  let computedLocale = locale;
  if (computedLocale === undefined) {
    if (ARABIC_PERSIAN_DETECT_RE.test(input)) {
      computedLocale = 'ar';
    } else if (HAN_DETECT_RE.test(input)) {
      computedLocale = 'zh';
    }
  }

  const { group, decimal, exponentSeparator } = getNumberLocaleDetails(computedLocale, options);
  const localeDigits = getLocaleDigits(computedLocale, options);

  // Normalize unicode minus/plus to ASCII, handle leading/trailing signs
  input = input.replace(ANY_MINUS_RE, '-').replace(ANY_PLUS_RE, '+');

  let isNegative = false;

  // Strips a matched sign (leading "-12" / trailing "1234-") while recording negativity.
  const takeSign = (match: string, sign: string) => {
    if (sign === '-') {
      isNegative = true;
    }
    return '';
  };

  input = input.replace(/([+-])\s*$/, takeSign).replace(/^\s*([+-])/, takeSign);

  // Accounting formats show negatives in parentheses, such as `($1.00)`
  if (options?.currencySign === 'accounting') {
    input = input.replace(/^\s*\((.*)\)\s*$/, (match, inner: string) => {
      isNegative = true;
      return inner;
    });
  }

  // Remove the formatter's own labels while they still match exactly, so a `.` inside a label
  // (`st. C`) can't be read as a separator. Signs are taken first, so a hyphen left behind by a
  // label that only partly matches (`7 n-acra`) isn't read as one.
  const formatter = getFormatter(computedLocale, options);
  [SAMPLE_FORMAT_NUMBER, 1].forEach((value) => {
    formatter.formatToParts(value).forEach((part) => {
      if (part.type === 'currency' || part.type === 'unit') {
        input = input.replaceAll(part.value.replace(FORMAT_CONTROL_GLOBAL_RE, ''), '');
      }
    });
  });

  // Numeral systems to ASCII digits
  const toAsciiDigits = (text: string) =>
    text.replace(/[\p{Nd}零〇一二三四五六七八九]/gu, (ch) => {
      const localeDigit = localeDigits.indexOf(ch);
      const hanDigit = HAN_NUMERALS.indexOf(ch);
      if (localeDigit !== -1) {
        return String(localeDigit);
      }
      if (hanDigit !== -1) {
        return String(Math.max(hanDigit - 1, 0));
      }
      return NON_ASCII_DIGIT_RE.test(ch) ? String(ch.charCodeAt(0) % 16) : ch;
    });

  input = toAsciiDigits(input);
  // The exponent separator can contain digits (`×۱۰^` in fa-IR), typed in either numeral system
  if (exponentSeparator) {
    input = input.replaceAll(toAsciiDigits(exponentSeparator), 'e');
  }
  // A separator always comes before a digit, so drop dots that don't, such as the one left by a
  // partially deleted unit label (`21,5 st.`)
  input = input.replace(/\.(?!\d)/g, '');

  if (group) {
    let groupPattern: string | RegExp = group;
    if (/\p{Zs}/u.test(group)) {
      groupPattern = /\p{Zs}/gu;
    } else if (/['’]/.test(group)) {
      // Some environments format numbers with ASCII apostrophe and others with a curly apostrophe.
      groupPattern = /['’]/g;
    }
    input = input.replaceAll(groupPattern, '');
  }

  let unformatted = input
    .replaceAll(decimal, '.')
    .replace(/[．٫]/g, '.') // FULLWIDTH_DECIMAL, ARABIC DECIMAL SEPARATOR (U+066B)
    .replace(/[，٬%٪％﹪‰؉]/g, '') // FULLWIDTH_GROUP, ARABIC THOUSANDS SEPARATOR, percent, permille
    // Remove the space a prefix label leaves behind (`R$ 13,00` → ` 13.00`), which would otherwise
    // separate the sign from the digits
    .trim();

  // Mixed-locale safety: keep only the last '.' as decimal
  const integerParts = unformatted.split('.');
  const fraction = integerParts.pop() ?? '';
  unformatted = integerParts.length ? `${integerParts.join('')}.${fraction}` : fraction;

  // Guard against Infinity inputs (ASCII and symbol)
  if (/^[-+]?Infinity$/i.test(input) || input.includes('∞')) {
    return null;
  }

  let num = parseFloat((isNegative ? '-' : '') + unformatted);

  // Check for a typed `%` after the labels are gone, so a unit whose label contains one
  // (`celsius-per-percent`) isn't rescaled
  if (PERMILLE_RE.test(input)) {
    num = shiftDecimal(num, -3);
  } else if (
    !(options?.style === 'unit' && options.unit === 'percent') &&
    (PERCENT_RE.test(input) || options?.style === 'percent')
  ) {
    num = shiftDecimal(num, -2);
  }

  if (!Number.isFinite(num)) {
    return null;
  }

  return num;
}
