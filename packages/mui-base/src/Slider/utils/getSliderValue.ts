import { clamp } from '../../utils/clamp';
import { setValueIndex } from './setValueIndex';

interface GetSliderValueParameters {
  valueInput: number;
  index: number;
  min: number;
  max: number;
  range: boolean;
  values: readonly number[];
}

export function getSliderValue(params: GetSliderValueParameters) {
  const { valueInput, index, min, max, range, values } = params;

  let newValue: number | number[] = valueInput;

  newValue = clamp(newValue, min, max);

  if (range) {
    // Bound the new value to the thumb's neighbours.
    newValue = clamp(newValue, values[index - 1] || -Infinity, values[index + 1] || Infinity);

    newValue = setValueIndex({
      values,
      newValue,
      index,
    });
  }

  return newValue;
}
