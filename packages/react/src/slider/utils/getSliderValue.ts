import { clamp } from '../../utils/clamp';
import { replaceArrayItemAtIndex } from './replaceArrayItemAtIndex';

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
    newValue = replaceArrayItemAtIndex(
      values,
      index,
      // Bound the new value to the thumb's neighbours.
      clamp(newValue, values[index - 1] || -Infinity, values[index + 1] || Infinity),
    );
  }

  return newValue;
}
