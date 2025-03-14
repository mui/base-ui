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
    stepSnap,
  }: {
    step: number | undefined;
    minWithDefault: number;
    maxWithDefault: number;
    minWithZeroDefault: number;
    format: Intl.NumberFormatOptions | undefined;
    stepSnap: boolean | ((value: number) => number);
  },
) {
  if (value === null) {
    return value;
  }

  const clampedValue = clamp(value, minWithDefault, maxWithDefault);

  if (typeof stepSnap === 'function') {
    const customSnappedValue = stepSnap(clampedValue);
    const boundedValue = clamp(customSnappedValue, minWithDefault, maxWithDefault);
    return removeFloatingPointErrors(boundedValue, format);
  }

  // Ensure values are divisible by the step, starting from the min value.
  if (step != null && stepSnap) {
    const stepsFromMin = (clampedValue - minWithZeroDefault) / step;
    const roundedSteps = Math.round(stepsFromMin);
    const snappedValue = minWithZeroDefault + roundedSteps * step;
    return removeFloatingPointErrors(snappedValue, format);
  }

  return clampedValue;
}
