import { clamp } from '../../internals/clamp';
import { getFormatter } from '../../utils/formatNumber';

const STEP_EPSILON_FACTOR = 1e-10;
// Matches Intl.NumberFormat's decimal maximumFractionDigits default.
const DEFAULT_DIGITS = 3;
// Keep committed-value normalization aligned with Number Field's max-precision display path.
const MAX_DIGITS = 20;
// Keeps binary scale/unscale noise out of committed percent values while preserving meaningful input.
const FLOATING_POINT_SIGNIFICANT_DIGITS = 15;

// The repo compiles against es2022 Intl types, so model NumberFormat v3 options locally.
// Delete this once tsconfig.base.json includes es2023.
type NumberFormatOptionsWithRounding = Intl.NumberFormatOptions & {
  roundingIncrement?: number | undefined;
  roundingMode?: string | undefined;
  roundingPriority?: string | undefined;
};

export function hasNumberFormatRoundingOptions(
  format?: NumberFormatOptionsWithRounding,
): format is NumberFormatOptionsWithRounding {
  return (
    format?.maximumFractionDigits != null ||
    format?.minimumFractionDigits != null ||
    format?.maximumSignificantDigits != null ||
    format?.minimumSignificantDigits != null ||
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
  if (!hasRoundingOptions) {
    return Number(value.toFixed(DEFAULT_DIGITS));
  }

  const resolvedOptions = getFormatter('en-US', format).resolvedOptions();
  const digits = Math.min(
    format.maximumFractionDigits ?? resolvedOptions.maximumFractionDigits ?? DEFAULT_DIGITS,
    MAX_DIGITS,
  );

  // Percent values are stored as fractions, so rounding must happen at the displayed scale.
  const scale = format.style === 'percent' ? 100 : 1;
  let valueToRound = value * scale;

  if (!Number.isFinite(valueToRound)) {
    // Percent scaling can overflow for extreme finite values; fall back to the unscaled value.
    return value;
  }

  if (scale > 1) {
    // Directional Intl rounding has no tolerance for the binary noise introduced by `value * 100`.
    // Keep real precision while removing artifacts like 0.45999999999999996 for typed 0.46%.
    valueToRound = removeFloatingPointNoise(valueToRound);
  }

  const notation = format.notation;
  const supportsNumericNotation = notation === 'scientific' || notation === 'engineering';
  const roundedValue = Number(
    getFormatter('en-US', {
      // Keep style/unit/compact notation out so the formatted string parses back as a plain number.
      useGrouping: false,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
      minimumSignificantDigits: format.minimumSignificantDigits,
      maximumSignificantDigits: format.maximumSignificantDigits,
      notation: supportsNumericNotation ? notation : undefined,
      roundingIncrement: format.roundingIncrement,
      roundingMode: format.roundingMode,
      roundingPriority: format.roundingPriority,
    } as NumberFormatOptionsWithRounding).format(valueToRound),
  );

  if (!Number.isFinite(roundedValue)) {
    return value;
  }

  const nextValue = roundedValue / scale;
  return scale > 1 ? removeFloatingPointNoise(nextValue) : nextValue;
}

function removeFloatingPointNoise(value: number) {
  return Number(value.toPrecision(FLOATING_POINT_SIGNIFICANT_DIGITS));
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

  let nextValue = value;

  if (step != null && snapOnStep && step !== 0) {
    const base =
      small || minWithDefault === Number.MIN_SAFE_INTEGER ? minWithZeroDefault : minWithDefault;

    // Snap before clamping so non-step-aligned boundaries stay reachable.
    nextValue = snapToStep(nextValue, base, step, small ? 'nearest' : 'directional');
  }

  if (shouldClamp) {
    nextValue = clamp(nextValue, minWithDefault, maxWithDefault);
  }

  const roundedValue = removeFloatingPointErrors(nextValue, format);
  return shouldClamp ? clamp(roundedValue, minWithDefault, maxWithDefault) : roundedValue;
}
