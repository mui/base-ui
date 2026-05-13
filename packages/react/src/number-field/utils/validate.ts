import { clamp } from '../../internals/clamp';
import { getFormatter } from '../../utils/formatNumber';

const STEP_EPSILON_FACTOR = 1e-10;

// The repo compiles against es2022 Intl types, so model NumberFormat v3 options locally.
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

  if (!Number.isFinite(valueToRound)) {
    return valueToRound / scale;
  }

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
  value: number,
  base: number,
  step: number,
  mode: 'directional' | 'nearest' = 'directional',
) {
  if (step === 0) {
    return value;
  }

  const stepSize = Math.abs(step);
  const direction = Math.sign(step);
  const tolerance = stepSize * STEP_EPSILON_FACTOR * direction;
  const divisor = mode === 'nearest' ? step : stepSize;
  const rawSteps = (value - base + tolerance) / divisor;

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

  let result = value;

  if (step != null && snapOnStep && step !== 0) {
    const base =
      small || minWithDefault === Number.MIN_SAFE_INTEGER ? minWithZeroDefault : minWithDefault;

    // Snap before clamping so non-step-aligned boundaries stay reachable.
    result = snapToStep(result, base, step, small ? 'nearest' : 'directional');
  }

  if (shouldClamp) {
    result = clamp(result, minWithDefault, maxWithDefault);
  }

  return removeFloatingPointErrors(result, format);
}
