import { clamp } from '../../internals/clamp';
import { getFormatter } from '../../utils/formatNumber';

const STEP_EPSILON_FACTOR = 1e-10;

// The repo compiles against es2022 Intl types, so model NumberFormat v3 options locally.
// Delete this once tsconfig.base.json includes es2023.
type NumberFormatOptionsWithRounding = Intl.NumberFormatOptions & {
  roundingIncrement?: number | undefined;
  roundingMode?: string | undefined;
  roundingPriority?: string | undefined;
};

export function hasExplicitNumberFormatPrecision(format?: NumberFormatOptionsWithRounding) {
  return (
    format?.maximumFractionDigits != null ||
    format?.minimumFractionDigits != null ||
    format?.maximumSignificantDigits != null ||
    format?.minimumSignificantDigits != null
  );
}

export function hasNumberFormatRoundingOptions(format?: NumberFormatOptionsWithRounding) {
  return (
    hasExplicitNumberFormatPrecision(format) ||
    format?.roundingIncrement != null ||
    format?.roundingMode != null ||
    format?.roundingPriority != null
  );
}

export function removeFloatingPointErrors(value: number, format?: NumberFormatOptionsWithRounding) {
  if (!Number.isFinite(value)) {
    return value;
  }

  const hasRoundingOptions = hasNumberFormatRoundingOptions(format);
  const resolvedOptions =
    format && (hasRoundingOptions || format.minimumFractionDigits != null)
      ? getFormatter('en-US', format).resolvedOptions()
      : undefined;
  const minimumFractionDigits =
    format?.minimumFractionDigits ?? resolvedOptions?.minimumFractionDigits ?? 0;
  const digits = Math.min(
    Math.max(
      format?.maximumFractionDigits ??
        (hasRoundingOptions || format?.minimumFractionDigits != null
          ? (resolvedOptions?.maximumFractionDigits ?? 3)
          : 3),
      minimumFractionDigits,
      0,
    ),
    20,
  );
  // Percent values are stored as fractions, so rounding must happen at the displayed scale.
  const scale = format?.style === 'percent' && hasRoundingOptions ? 100 : 1;
  let valueToRound = value * scale;

  if (!Number.isFinite(valueToRound)) {
    // Percent scaling can overflow for extreme finite values; fall back to the unscaled value.
    return value;
  }

  if (scale !== 1) {
    // Directional Intl rounding has no tolerance for the binary noise introduced by `value * 100`.
    // Clean a few extra decimal places first so exact typed boundaries like 0.46% stay exact.
    valueToRound = Number(valueToRound.toFixed(Math.min(digits + 6, 20)));
  }

  if (hasRoundingOptions) {
    return (
      Number(
        getFormatter('en-US', {
          // Keep style/unit/notation out so the formatted string parses back as a plain number.
          useGrouping: false,
          minimumFractionDigits: digits,
          maximumFractionDigits: digits,
          minimumSignificantDigits: format?.minimumSignificantDigits,
          maximumSignificantDigits: format?.maximumSignificantDigits,
          roundingIncrement: format?.roundingIncrement,
          roundingMode: format?.roundingMode,
          roundingPriority: format?.roundingPriority,
        } as NumberFormatOptionsWithRounding).format(valueToRound),
      ) / scale
    );
  }

  return Number(valueToRound.toFixed(digits)) / scale;
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
