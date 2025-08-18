import { formatNumber } from '@base-ui-components/utils/formatNumber';

/**
 * @internal Number Field precision workaround.
 */
export function formatNumberMaxPrecision(
  value: number | null,
  locale?: Intl.LocalesArgument,
  options?: Intl.NumberFormatOptions,
) {
  return formatNumber(value, locale, {
    ...options,
    maximumFractionDigits: 20,
  });
}
