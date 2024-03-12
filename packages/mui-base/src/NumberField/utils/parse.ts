import { getFormatter } from './cache';

export const HAN_NUMERALS = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
export const ARABIC_NUMERALS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

export function getNumberLocaleDetails(options?: Intl.NumberFormatOptions) {
  const parts = getFormatter(options).formatToParts(1111.1);
  const result: Partial<Record<Intl.NumberFormatPartTypes, string | undefined>> = {};

  parts.forEach((part) => {
    result[part.type] = part.value;
  });

  return result;
}

export function parseNumber(formattedNumber: string, options?: Intl.NumberFormatOptions) {
  const { group, decimal, currency, percent, unit, code } = getNumberLocaleDetails(options);

  const rawNumber = formattedNumber
    .replace(new RegExp(`\\${group}`, 'g'), '')
    .replace(new RegExp(`\\${decimal}`, 'g'), '.')
    .replace(new RegExp(`\\${currency}`, 'g'), '')
    .replace(new RegExp(`\\${percent}`, 'g'), '')
    .replace(new RegExp(`\\${unit}`, 'g'), '')
    .replace(new RegExp(`\\${code}`, 'g'), '')
    .replace(new RegExp(`[${ARABIC_NUMERALS.join('')}]`, 'g'), (match) =>
      ARABIC_NUMERALS.indexOf(match).toString(),
    )
    .replace(new RegExp(`[${HAN_NUMERALS.join('')}]`, 'g'), (match) =>
      HAN_NUMERALS.indexOf(match).toString(),
    );

  const num = Number(rawNumber);

  if (Number.isNaN(num)) {
    return null;
  }

  return num;
}
