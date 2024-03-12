import { clamp } from '../../utils/clamp';

export function toValidatedNumber(
  value: number | null,
  step: number | undefined,
  minWithDefault: number,
  maxWithDefault: number,
  minWithZeroDefault: number,
) {
  if (value === null) {
    return value;
  }

  const clampedValue = clamp(value, minWithDefault, maxWithDefault);

  // Ensure values are divisible by the step, starting from the min value.
  if (step != null) {
    const stepsFromMin = (clampedValue - minWithZeroDefault) / step;
    const roundedSteps = Math.round(stepsFromMin);
    const snappedValue = minWithZeroDefault + roundedSteps * step;
    return snappedValue;
  }

  return clampedValue;
}
