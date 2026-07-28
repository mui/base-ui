import { clamp } from '../../internals/clamp';

/**
 * Returns a new array of slider values where attempting to move the thumb at `index`
 * beyond its neighbours "pushes" them while respecting `minStepsBetweenValues`.
 *
 * Positional arguments are deliberate: property names of an options object don't
 * minify, so passing them positionally keeps this internal helper smaller in the bundle.
 */
export function getPushedThumbValues(
  values: readonly number[],
  index: number,
  nextValue: number,
  min: number,
  max: number,
  step: number,
  minStepsBetweenValues: number,
  initialValues?: readonly number[] | undefined,
): number[] {
  const nextValues = values.slice();
  const minValueDifference = step * minStepsBetweenValues;
  const lastIndex = nextValues.length - 1;
  const baseInitialValues = initialValues ?? values;

  const indexMin = min + index * minValueDifference;
  const indexMax = max - (lastIndex - index) * minValueDifference;
  nextValues[index] = clamp(nextValue, indexMin, indexMax);

  for (let i = index + 1; i <= lastIndex; i += 1) {
    const minAllowed = nextValues[i - 1] + minValueDifference;
    const maxAllowed = max - (lastIndex - i) * minValueDifference;
    const initialValue = baseInitialValues[i];
    let candidate = Math.max(nextValues[i], minAllowed);

    if (initialValue < candidate) {
      candidate = Math.max(initialValue, minAllowed);
    }

    nextValues[i] = clamp(candidate, minAllowed, maxAllowed);
  }

  for (let i = index - 1; i >= 0; i -= 1) {
    const maxAllowed = nextValues[i + 1] - minValueDifference;
    const minAllowed = min + i * minValueDifference;
    const initialValue = baseInitialValues[i];
    let candidate = Math.min(nextValues[i], maxAllowed);

    if (initialValue > candidate) {
      candidate = Math.min(initialValue, maxAllowed);
    }

    nextValues[i] = clamp(candidate, minAllowed, maxAllowed);
  }

  for (let i = 0; i <= lastIndex; i += 1) {
    nextValues[i] = Number(nextValues[i].toFixed(12));
  }

  return nextValues;
}
