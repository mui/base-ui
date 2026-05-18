import { clamp } from '../../internals/clamp';
import { getFormatter } from '../../utils/formatNumber';

const STEP_EPSILON_FACTOR = 1e-10;

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

function getMaximumFractionDigits(format?: NumberFormatOptionsWithRounding) {
  // Preserve the old decimal defaults unless min-only precision needs style-specific defaults.
  const minimumFractionDigits = format?.minimumFractionDigits ?? 0;

  if (format?.maximumFractionDigits != null) {
    return Math.max(format.maximumFractionDigits, minimumFractionDigits);
  }

  if (format?.minimumFractionDigits == null) {
    return 3;
  }

  // Some invalid Intl option combinations throw when constructing the formatter. Rendering usually
  // fails first for those configs, but keep blur-time rounding on the safe decimal fallback.
  try {
    return Math.max(
      getFormatter('en-US', format).resolvedOptions().maximumFractionDigits ?? 20,
      minimumFractionDigits,
    );
  } catch {
    return Math.max(3, minimumFractionDigits);
  }
}

export function removeFloatingPointErrors(value: number, format?: NumberFormatOptionsWithRounding) {
  if (!Number.isFinite(value)) {
    return value;
  }

  const digits = Math.min(Math.max(getMaximumFractionDigits(format), 0), 20);
  const hasSignificantPrecision =
    format?.maximumSignificantDigits != null || format?.minimumSignificantDigits != null;
  // Percent values are stored as fractions, so rounding must happen at the displayed scale.
  const isPercentWithExplicitPrecision =
    format?.style === 'percent' && hasExplicitNumberFormatPrecision(format);
  const scale = isPercentWithExplicitPrecision ? 100 : 1;
  let valueToRound = value * scale;

  if (!Number.isFinite(valueToRound)) {
    // Percent scaling can overflow for extreme finite values; preserve the old finite value.
    return value;
  }

  if (scale !== 1) {
    // Directional Intl rounding has no tolerance for the binary noise introduced by `value * 100`.
    // Clean a few extra decimal places first so exact typed boundaries like 0.46% stay exact.
    valueToRound = Number(valueToRound.toFixed(Math.min(digits + 6, 20)));
  }

  const roundedFallback = Number(valueToRound.toFixed(digits)) / scale;

  if (
    !hasSignificantPrecision &&
    format?.roundingIncrement == null &&
    format?.roundingMode == null &&
    format?.roundingPriority == null
  ) {
    return roundedFallback;
  }

  try {
    // Keep style/unit/notation out so the formatted string parses back as a plain number.
    const roundingFormatOptions = {
      useGrouping: false,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
      minimumSignificantDigits: format?.minimumSignificantDigits,
      maximumSignificantDigits: format?.maximumSignificantDigits,
      roundingIncrement: format?.roundingIncrement,
      roundingMode: format?.roundingMode,
      roundingPriority: format?.roundingPriority,
    } satisfies NumberFormatOptionsWithRounding;

    const roundedValue = Number(getFormatter('en-US', roundingFormatOptions).format(valueToRound));

    return Number.isFinite(roundedValue) ? roundedValue / scale : roundedFallback;
  } catch {
    return roundedFallback;
  }
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
