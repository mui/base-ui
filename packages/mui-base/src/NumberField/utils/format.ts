import { getFormatter } from './cache';

export function formatNumber(value: number | null, options?: Intl.NumberFormatOptions) {
  return typeof value === 'number' ? getFormatter(options).format(value) : '';
}
