import { getFormatter } from '../../utils/formatNumber';

// Han numerals in digit order, with both zero forms first ('零' at 0, '〇' at 1), so a
// character's digit value is `max(indexOf - 1, 0)`.
const HAN_NUMERALS = '零〇一二三四五六七八九';

// Arabic-Indic (U+0660–0669), Persian (U+06F0–06F9), and fullwidth (U+FF10–FF19) digits are
// contiguous ranges whose bases are divisible by 16, so `charCode % 16` is the digit value for
// all three systems.
const NON_ASCII_DIGIT_RE = /[٠-٩۰-۹０-９]/g;
const HAN_RE = /[零〇一二三四五六七八九]/g;

export const PERCENTAGES = ['%', '٪', '％', '﹪'];
export const PERMILLE = ['‰', '؉'];

// Fullwidth punctuation common in CJK inputs
export const FULLWIDTH_DECIMAL = '．'; // U+FF0E
export const FULLWIDTH_GROUP = '，'; // U+FF0C

export const PERCENT_RE = /[%٪％﹪]/;
export const PERMILLE_RE = /[‰؉]/;
const PERCENT_GLOBAL_RE = /[%٪％﹪]/g;
const PERMILLE_GLOBAL_RE = /[‰؉]/g;

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

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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
  // from the plain locale formatter. This overrides any options-derived decimal too, which is
  // safe because the separator is locale-determined and identical across format styles.
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
  let input = String(formattedNumber).replace(FORMAT_CONTROL_GLOBAL_RE, '').trim();

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

  // Heuristic locale detection
  let computedLocale = locale;
  if (computedLocale === undefined) {
    if (ARABIC_PERSIAN_DETECT_RE.test(input)) {
      computedLocale = 'ar';
    } else if (HAN_DETECT_RE.test(input)) {
      computedLocale = 'zh';
    }
  }

  const { group, decimal, currency, exponentSeparator } = getNumberLocaleDetails(
    computedLocale,
    options,
  );

  // Build robust unit regex from all unit parts (such as "km/h")
  const unitParts = getFormatter(computedLocale, options)
    .formatToParts(1)
    .filter((p) => p.type === 'unit')
    .map((p) => escapeRegExp(p.value));
  const unitRegex = unitParts.length ? new RegExp(unitParts.join('|'), 'g') : null;

  let groupRegex: RegExp | null = null;
  if (group) {
    const isSpaceGroup = /\p{Zs}/u.test(group);
    const isApostropheGroup = group === "'" || group === '’';

    // Check if the group separator is a space-like character.
    // If so, we'll replace all such characters with an empty string.
    if (isSpaceGroup) {
      groupRegex = /\p{Zs}/gu;
    } else if (isApostropheGroup) {
      // Some environments format numbers with ASCII apostrophe and others with a curly apostrophe.
      groupRegex = /['’]/g;
    } else {
      groupRegex = new RegExp(escapeRegExp(group), 'g');
    }
  }

  const replacements: Array<[RegExp | null, string | ((m: string) => string)]> = [
    [groupRegex, ''],
    [decimal ? new RegExp(escapeRegExp(decimal), 'g') : null, '.'],
    // Fullwidth/Arabic punctuation
    [/[．٫]/g, '.'], // FULLWIDTH_DECIMAL, ARABIC DECIMAL SEPARATOR (U+066B)
    [/[，٬]/g, ''], // FULLWIDTH_GROUP, ARABIC THOUSANDS SEPARATOR (U+066C)
    // Currency & unit labels
    [currency ? new RegExp(escapeRegExp(currency), 'g') : null, ''],
    [unitRegex, ''],
    [PERCENT_GLOBAL_RE, ''],
    [PERMILLE_GLOBAL_RE, ''],
    [exponentSeparator ? new RegExp(escapeRegExp(exponentSeparator), 'g') : null, 'e'],
    // Numeral systems to ASCII digits
    [NON_ASCII_DIGIT_RE, (ch: string) => String(ch.charCodeAt(0) % 16)],
    [HAN_RE, (ch: string) => String(Math.max(HAN_NUMERALS.indexOf(ch) - 1, 0))],
  ];

  let unformatted = replacements.reduce((acc, [regex, replacement]) => {
    return regex ? acc.replace(regex, replacement as any) : acc;
  }, input);

  // Mixed-locale safety: keep only the last '.' as decimal
  const lastDot = unformatted.lastIndexOf('.');
  if (lastDot !== -1) {
    unformatted = `${unformatted.slice(0, lastDot).replace(/\./g, '')}.${unformatted.slice(lastDot + 1).replace(/\./g, '')}`;
  }

  // Guard against Infinity inputs (ASCII and symbol)
  if (/^[-+]?Infinity$/i.test(input) || input.includes('∞')) {
    return null;
  }

  const parseTarget = (isNegative ? '-' : '') + unformatted;

  let num = parseFloat(parseTarget);

  const style = options?.style;
  const isUnitPercent = style === 'unit' && options?.unit === 'percent';
  const hasPercentSymbol = PERCENT_RE.test(formattedNumber) || style === 'percent';
  const hasPermilleSymbol = PERMILLE_RE.test(formattedNumber);

  if (hasPermilleSymbol) {
    num = shiftDecimal(num, -3);
  } else if (!isUnitPercent && hasPercentSymbol) {
    num = shiftDecimal(num, -2);
  }

  if (!Number.isFinite(num)) {
    return null;
  }

  return num;
}
