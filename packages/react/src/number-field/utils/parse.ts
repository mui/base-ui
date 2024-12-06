import { getFormatter } from '../../utils/formatNumber';

export const HAN_NUMERALS = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
export const ARABIC_NUMERALS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
export const PERCENTAGES = ['%', '٪'];

export const ARABIC_RE = new RegExp(`[${ARABIC_NUMERALS.join('')}]`, 'g');
export const HAN_RE = new RegExp(`[${HAN_NUMERALS.join('')}]`, 'g');
export const PERCENT_RE = new RegExp(`[${PERCENTAGES.join('')}]`);

export function getNumberLocaleDetails(
  locale?: string | string[],
  options?: Intl.NumberFormatOptions,
) {
  const parts = getFormatter(locale, options).formatToParts(1111.1);
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

export function parseNumber(formattedNumber: string, options?: Intl.NumberFormatOptions) {
  let locale: string | undefined;
  if (ARABIC_RE.test(formattedNumber)) {
    locale = 'ar';
  } else if (HAN_RE.test(formattedNumber)) {
    locale = 'zh';
  }

  const { group, decimal, currency, unit } = getNumberLocaleDetails(locale, options);

  const regexesToReplace = [
    { regex: group ? new RegExp(`\\${group}`, 'g') : null, replacement: '' },
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

  if (PERCENT_RE.test(formattedNumber)) {
    num /= 100;
  }

  if (Number.isNaN(num)) {
    return null;
  }

  return num;
}
