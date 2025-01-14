import { clamp } from '../../utils/clamp';
import { replaceArrayItemAtIndex } from './replaceArrayItemAtIndex';
import type { SliderValue } from '../root/useSliderRoot';

export function getSliderValue<Value>(
  valueInput: number,
  index: number,
  min: number,
  max: number,
  range: boolean,
  values: readonly number[],
): SliderValue<Value> {
  let newValue: number | number[] = valueInput;

  newValue = clamp(newValue, min, max);

  if (range) {
    newValue = replaceArrayItemAtIndex(
      values,
      index,
      // Bound the new value to the thumb's neighbours.
      clamp(newValue, values[index - 1] || -Infinity, values[index + 1] || Infinity),
    );
  }

  return newValue as SliderValue<Value>;
}
