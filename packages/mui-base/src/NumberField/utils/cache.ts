export const cache = new Map<string, Intl.NumberFormat>();

export function getFormatter(options?: Intl.NumberFormatOptions) {
  const optionsString = JSON.stringify(options);
  const cachedFormatter = cache.get(optionsString);

  if (cachedFormatter) {
    return cachedFormatter;
  }

  const formatter = new Intl.NumberFormat(undefined, options);
  cache.set(optionsString, formatter);

  return formatter;
}
