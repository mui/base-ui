import { clamp } from '@base-ui/utils/clamp';
import { asc } from './asc';

export function getSliderValue(
  valueInput: number,
  index: number,
  min: number,
  max: number,
  range: boolean,
  values: readonly number[],
) {
  const clamped = clamp(valueInput, min, max);

  if (!range) {
    return clamped;
  }

  const output = values.slice();
  // Bound the new value to the thumb's neighbours.
  output[index] = clamp(clamped, values[index - 1] ?? -Infinity, values[index + 1] ?? Infinity);
  return output.sort(asc);
}
