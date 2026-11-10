import { formatNumber } from '@base-ui/utils/formatNumber';

/**
 * Formats the value with `format` when provided, otherwise as a percentage of the range.
 * Returns an empty string while the value is unknown.
 */
export function formatRangeValue(
  value: number | null,
  percentageValue: number | null,
  locale: Intl.LocalesArgument | undefined,
  format: Intl.NumberFormatOptions | undefined,
) {
  if (value == null || percentageValue == null) {
    return '';
  }
  return format
    ? formatNumber(value, locale, format)
    : formatNumber(percentageValue / 100, locale, { style: 'percent' });
}
