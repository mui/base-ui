import { clamp } from '../../utils/clamp';
import { getFormatter } from '../../utils/formatNumber';

const STEP_EPSILON_FACTOR = 1e-10;

function getFractionDigits(format?: Intl.NumberFormatOptions) {
  const defaultOptions = getFormatter('en-US').resolvedOptions();
  const minimumFractionDigits =
    format?.minimumFractionDigits ?? defaultOptions.minimumFractionDigits ?? 0;
  const maximumFractionDigits = Math.max(
    format?.maximumFractionDigits ?? defaultOptions.maximumFractionDigits ?? 20,
    minimumFractionDigits,
  );
  return { maximumFractionDigits, minimumFractionDigits };
}

function roundToFractionDigits(value: number, maximumFractionDigits: number) {
  if (!Number.isFinite(value)) {
    return value;
  }
  const digits = Math.min(Math.max(maximumFractionDigits, 0), 20);
  return Number(value.toFixed(digits));
}

export function removeFloatingPointErrors(value: number, format?: Intl.NumberFormatOptions) {
  const { maximumFractionDigits } = getFractionDigits(format);
  return roundToFractionDigits(value, maximumFractionDigits);
}

function snapToStep(
  clampedValue: number,
  base: number,
  step: number,
  mode: 'directional' | 'nearest' = 'directional',
) {
  if (step === 0) {
    return clampedValue;
  }

  const stepSize = Math.abs(step);
  const direction = Math.sign(step);
  const tolerance = stepSize * STEP_EPSILON_FACTOR * direction;
  const divisor = mode === 'nearest' ? step : stepSize;
  const rawSteps = (clampedValue - base + tolerance) / divisor;

  let snappedSteps: number;
  if (mode === 'nearest') {
    snappedSteps = Math.round(rawSteps);
  } else if (direction > 0) {
    snappedSteps = Math.floor(rawSteps);
  } else {
    snappedSteps = Math.ceil(rawSteps);
  }

  const stepForResult = mode === 'nearest' ? step : stepSize;

  return base + snappedSteps * stepForResult;
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
    if (step === 0) {
      return removeFloatingPointErrors(clampedValue, format);
    }

    // If a real minimum is provided, use it
    let base = minWithZeroDefault;
    if (!small && minWithDefault !== Number.MIN_SAFE_INTEGER) {
      base = minWithDefault;
    }

    const snappedValue = snapToStep(clampedValue, base, step, small ? 'nearest' : 'directional');
    return removeFloatingPointErrors(snappedValue, format);
  }

  return removeFloatingPointErrors(clampedValue, format);
}
