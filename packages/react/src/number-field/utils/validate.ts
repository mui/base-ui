import { clamp } from '../../internals/clamp';
import { getFormatter } from '../../utils/formatNumber';

const STEP_EPSILON_FACTOR = 1e-10;

// The repo's configured Intl types do not include the newer NumberFormat v3 rounding options yet.
type NumberFormatOptionsWithRounding = Intl.NumberFormatOptions & {
  roundingIncrement?: number | undefined;
  roundingMode?: string | undefined;
};

function getMaximumFractionDigits(format?: NumberFormatOptionsWithRounding) {
  return Math.max(
    format?.maximumFractionDigits ??
      getFormatter(
        'en-US',
        format?.minimumFractionDigits == null ? undefined : format,
      ).resolvedOptions().maximumFractionDigits ??
      20,
    format?.minimumFractionDigits ?? 0,
  );
}

export function removeFloatingPointErrors(value: number, format?: NumberFormatOptionsWithRounding) {
  if (!Number.isFinite(value)) {
    return value;
  }

  const digits = Math.min(Math.max(getMaximumFractionDigits(format), 0), 20);
  const isPercentWithExplicitPrecision =
    format?.style === 'percent' &&
    (format.maximumFractionDigits != null || format.minimumFractionDigits != null);
  const scale = isPercentWithExplicitPrecision ? 100 : 1;
  const valueToRound = value * scale;

  if (format?.roundingIncrement == null && format?.roundingMode == null) {
    return Number(valueToRound.toFixed(digits)) / scale;
  }

  const roundingFormatOptions: NumberFormatOptionsWithRounding = {
    useGrouping: false,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    roundingIncrement: format.roundingIncrement,
    roundingMode: format.roundingMode,
  };

  return Number(getFormatter('en-US', roundingFormatOptions).format(valueToRound)) / scale;
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
    clamp: shouldClamp,
  }: {
    step: number | undefined;
    minWithDefault: number;
    maxWithDefault: number;
    minWithZeroDefault: number;
    format: NumberFormatOptionsWithRounding | undefined;
    snapOnStep: boolean;
    small: boolean;
    clamp: boolean;
  },
) {
  if (value === null) {
    return value;
  }

  const clampedValue = shouldClamp ? clamp(value, minWithDefault, maxWithDefault) : value;

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
