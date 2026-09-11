import { clamp } from '@base-ui/utils/clamp';
import { asc } from './asc';

/**
 * Returns one value per thumb, clamped to the bounds and sorted.
 */
export function normalizeValues(
  value: number | readonly number[],
  min: number,
  max: number,
): readonly number[] {
  if (Array.isArray(value)) {
    return value.map((item) => clamp(item, min, max)).sort(asc);
  }
  return [clamp(value as number, min, max)];
}
