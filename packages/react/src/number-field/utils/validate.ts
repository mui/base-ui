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
    snapOnStep,
    small,
  }: {
    step: number | undefined;
    minWithDefault: number;
    maxWithDefault: number;
    minWithZeroDefault: number;
    format: Intl.NumberFormatOptions | undefined;
    snapOnStep: boolean;
    small: boolean;
  },
) {
  if (value === null) {
    return value;
  }

  const clampedValue = clamp(value, minWithDefault, maxWithDefault);

  if (step != null && snapOnStep) {
    if (small) {
      const stepsFromMin = (clampedValue - minWithZeroDefault) / step;
      const roundedSteps = Math.round(stepsFromMin);
      const snappedValue = minWithZeroDefault + roundedSteps * step;
      return removeFloatingPointErrors(snappedValue, format);
    }

    // If a real minimum is provided, use it
    const base = minWithDefault !== Number.MIN_SAFE_INTEGER ? minWithDefault : minWithZeroDefault;

    if (step > 0) {
      // "Undo" the increment by subtracting step, then snap.
      const unsnapped = clampedValue - step;
      const steps = Math.floor((unsnapped - base) / step);
      // Reapply the increment by adding step
      return removeFloatingPointErrors(base + steps * step + step, format);
    }

    if (step < 0) {
      const absStep = Math.abs(step);
      const unsnapped = clampedValue - step;
      const steps = Math.ceil((unsnapped - base) / absStep);
      return removeFloatingPointErrors(base + steps * absStep + step, format);
    }
  }

  return clampedValue;
}
