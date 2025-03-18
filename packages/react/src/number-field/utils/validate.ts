import { getFormatter } from '../../utils/formatNumber';
import { clamp } from '../../utils/clamp';

export function removeFloatingPointErrors(value: number, format: Intl.NumberFormatOptions = {}) {
  return parseFloat(
    getFormatter('en-US', {
      maximumFractionDigits: format.maximumFractionDigits,
      minimumFractionDigits: format.minimumFractionDigits,
      useGrouping: false,
    }).format(value),
  );
}

export function toValidatedNumber(
  value: number | null,
  {
    step,
    minWithDefault,
    maxWithDefault,
    minWithZeroDefault,
    format,
    stepBehavior,
  }: {
    step: number | undefined;
    minWithDefault: number;
    maxWithDefault: number;
    minWithZeroDefault: number;
    format: Intl.NumberFormatOptions | undefined;
    stepBehavior: 'snap' | 'free';
  },
) {
  if (value === null) {
    return value;
  }

  const clampedValue = clamp(value, minWithDefault, maxWithDefault);

  if (step != null && stepBehavior === 'snap') {
    // Ensure values are divisible by the step, starting from the min value.
    const stepsFromMin = (clampedValue - minWithZeroDefault) / step;
    const roundedSteps = Math.round(stepsFromMin);
    const snappedValue = minWithZeroDefault + roundedSteps * step;
    return removeFloatingPointErrors(snappedValue, format);
  }

  return clampedValue;
}
