import { getFormatter } from './format';

export const HAN_NUMERALS = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
export const ARABIC_NUMERALS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

export function getNumberLocaleDetails(locale?: string, options?: Intl.NumberFormatOptions) {
  const parts = getFormatter(locale, options).formatToParts(1111.1);
  const result: Partial<Record<Intl.NumberFormatPartTypes, string | undefined>> = {};

  parts.forEach((part) => {
    result[part.type] = part.value;
  });

  return result;
}

export function parseNumber(formattedNumber: string, options?: Intl.NumberFormatOptions) {
  const arabicRe = new RegExp(`[${ARABIC_NUMERALS.join('')}]`, 'g');
  const hanRe = new RegExp(`[${HAN_NUMERALS.join('')}]`, 'g');
  const percentRe = /%|٪/;

  const isArabic = formattedNumber.match(arabicRe);
  const isHan = formattedNumber.match(hanRe);

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
    .replace(arabicRe, (match) => ARABIC_NUMERALS.indexOf(match).toString())
    .replace(hanRe, (match) => HAN_NUMERALS.indexOf(match).toString());

  let num = parseFloat(rawNumber);

  if (percentRe.test(formattedNumber)) {
    num /= 100;
  }

  if (Number.isNaN(num)) {
    return null;
  }

  return num;
}
