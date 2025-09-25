import { clamp } from '../../utils/clamp';

interface GetPushedThumbValuesParams {
  values: readonly number[];
  index: number;
  nextValue: number;
  min: number;
  max: number;
  step: number;
  minStepsBetweenValues: number;
}

/**
 * Returns a new array of slider values where attempting to move the thumb at `index`
 * beyond its neighbours "pushes" them while respecting `minStepsBetweenValues`.
 */
export function getPushedThumbValues({
  values,
  index,
  nextValue,
  min,
  max,
  step,
  minStepsBetweenValues,
}: GetPushedThumbValuesParams): number[] {
  if (values.length === 0) {
    return [];
  }

  const nextValues = values.slice();
  const minValueDifference = step * minStepsBetweenValues;
  const lastIndex = nextValues.length - 1;

  const indexMin = min + index * minValueDifference;
  const indexMax = max - (lastIndex - index) * minValueDifference;
  nextValues[index] = clamp(nextValue, indexMin, indexMax);

  for (let i = index + 1; i <= lastIndex; i += 1) {
    const minAllowed = nextValues[i - 1] + minValueDifference;
    const maxAllowed = max - (lastIndex - i) * minValueDifference;
    const candidate = Math.max(nextValues[i], minAllowed);
    nextValues[i] = clamp(candidate, minAllowed, maxAllowed);
  }

  for (let i = index - 1; i >= 0; i -= 1) {
    const maxAllowed = nextValues[i + 1] - minValueDifference;
    const minAllowed = min + i * minValueDifference;
    const candidate = Math.min(nextValues[i], maxAllowed);
    nextValues[i] = clamp(candidate, minAllowed, maxAllowed);
  }

  for (let i = 0; i <= lastIndex; i += 1) {
    nextValues[i] = Number(nextValues[i].toFixed(12));
  }

  return nextValues;
}
