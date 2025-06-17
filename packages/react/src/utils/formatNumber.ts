export const cache = new Map<string, Intl.NumberFormat>();

export function getFormatter(locale?: Intl.LocalesArgument, options?: Intl.NumberFormatOptions) {
  const optionsString = JSON.stringify({ locale, options });
  const cachedFormatter = cache.get(optionsString);

  if (cachedFormatter) {
    return cachedFormatter;
  }

  const formatter = new Intl.NumberFormat(locale, options);
  cache.set(optionsString, formatter);

  return formatter;
}

export function formatNumber(
  value: number | null,
  locale?: Intl.LocalesArgument,
  options?: Intl.NumberFormatOptions,
) {
  if (value == null) {
    return '';
  }
  return getFormatter(locale, options).format(value);
}

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
