import { getFormatter } from './format';

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

  return result;
}

export function parseNumber(formattedNumber: string, options?: Intl.NumberFormatOptions) {
  const isArabic = formattedNumber.match(ARABIC_RE);
  const isHan = formattedNumber.match(HAN_RE);

  let locale: string | undefined;
  if (isArabic) {
    locale = 'ar';
  } else if (isHan) {
    locale = 'zh';
  }

  const { group, decimal, currency } = getNumberLocaleDetails(locale, options);

  const rawNumber = formattedNumber
    .replace(new RegExp(`\\${group}`, 'g'), '')
    .replace(new RegExp(`\\${decimal}`, 'g'), '.')
    .replace(new RegExp(`\\${currency}`, 'g'), '')
    .replace(ARABIC_RE, (match) => ARABIC_NUMERALS.indexOf(match).toString())
    .replace(HAN_RE, (match) => HAN_NUMERALS.indexOf(match).toString());

  let num = parseFloat(rawNumber);

  if (PERCENT_RE.test(formattedNumber)) {
    num /= 100;
  }

  if (Number.isNaN(num)) {
    return null;
  }

  return num;
}
