import { clamp } from '../../utils/clamp';
import { getFormatter } from './format';

export function removeFloatingPointErrors(value: number, format?: Intl.NumberFormatOptions) {
  return parseFloat(getFormatter(undefined, format).format(value));
}

export function toValidatedNumber(
  value: number | null,
  {
    step,
    minWithDefault,
    maxWithDefault,
    minWithZeroDefault,
    format,
  }: {
    step: number | undefined;
    minWithDefault: number;
    maxWithDefault: number;
    minWithZeroDefault: number;
    format: Intl.NumberFormatOptions | undefined;
  },
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
    return removeFloatingPointErrors(snappedValue, format);
  }

  return clampedValue;
}
