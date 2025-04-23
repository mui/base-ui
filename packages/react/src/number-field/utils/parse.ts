import { getFormatter } from '../../utils/formatNumber';

export const HAN_NUMERALS = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
export const ARABIC_NUMERALS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
export const PERCENTAGES = ['%', '٪'];

export const ARABIC_RE = new RegExp(`[${ARABIC_NUMERALS.join('')}]`, 'g');
export const HAN_RE = new RegExp(`[${HAN_NUMERALS.join('')}]`, 'g');
export const PERCENT_RE = new RegExp(`[${PERCENTAGES.join('')}]`);

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
  let computedLocale = locale;
  if (computedLocale === undefined) {
    if (ARABIC_RE.test(formattedNumber)) {
      computedLocale = 'ar';
    } else if (HAN_RE.test(formattedNumber)) {
      computedLocale = 'zh';
    }
  }

  const { group, decimal, currency, unit } = getNumberLocaleDetails(computedLocale, options);
  let groupRegex: RegExp | null = null;
  if (group) {
    // Check if the group separator is a space-like character.
    // If so, we'll replace all such characters with an empty string.
    groupRegex = /\p{Zs}/u.test(group) ? /\p{Zs}/gu : new RegExp(`\\${group}`, 'g');
  }

  const regexesToReplace = [
    { regex: group ? groupRegex : null, replacement: '' },
    { regex: decimal ? new RegExp(`\\${decimal}`, 'g') : null, replacement: '.' },
    { regex: currency ? new RegExp(`\\${currency}`, 'g') : null, replacement: '' },
    { regex: unit ? new RegExp(`\\${unit}`, 'g') : null, replacement: '' },
    { regex: ARABIC_RE, replacement: (match: string) => ARABIC_NUMERALS.indexOf(match).toString() },
    { regex: HAN_RE, replacement: (match: string) => HAN_NUMERALS.indexOf(match).toString() },
  ];

  const unformattedNumber = regexesToReplace.reduce((acc, { regex, replacement }) => {
    if (!regex) {
      return acc;
    }
    return acc.replace(regex, replacement as string);
  }, formattedNumber);

  let num = parseFloat(unformattedNumber);

  const style = options?.style;
  const isUnitPercent = style === 'unit' && options?.unit === 'percent';
  const isPercent = PERCENT_RE.test(formattedNumber) || style === 'percent';

  if (!isUnitPercent && isPercent) {
    num /= 100;
  }

  if (Number.isNaN(num)) {
    return null;
  }

  return num;
}
