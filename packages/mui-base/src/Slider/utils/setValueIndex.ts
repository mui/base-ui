import { asc } from './asc.js';

export function setValueIndex({
  values,
  newValue,
  index,
}: {
  values: readonly number[];
  newValue: number;
  index: number;
}) {
  const output = values.slice();
  output[index] = newValue;
  return output.sort(asc);
}
