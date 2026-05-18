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

function hasSignificantDigits(format?: NumberFormatOptionsWithRounding) {
  return format?.maximumSignificantDigits != null || format?.minimumSignificantDigits != null;
}

function roundToFractionDigits(value: number, maximumFractionDigits: number) {
  const digits = Math.min(Math.max(maximumFractionDigits, 0), 20);
  return Number(value.toFixed(digits));
}

function cleanScaledPercentValue(value: number, maximumFractionDigits: number) {
  // Directional Intl rounding has no tolerance for the binary noise introduced by `value * 100`.
  // Clean a few extra decimal places first so exact typed boundaries like 0.46% stay exact.
  const digits = Math.min(Math.max(maximumFractionDigits + 6, 0), 20);
  return Number(value.toFixed(digits));
}

function roundWithIntl(
  value: number,
  digits: number,
  format?: NumberFormatOptionsWithRounding,
): number {
  // Keep style/unit/notation out so the formatted string parses back as a plain number. Percent
  // scaling is applied explicitly before and after this formatter.
  const roundingFormatOptions: NumberFormatOptionsWithRounding = {
    useGrouping: false,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    minimumSignificantDigits: format?.minimumSignificantDigits,
    maximumSignificantDigits: format?.maximumSignificantDigits,
    roundingIncrement: format?.roundingIncrement,
    roundingMode: format?.roundingMode,
    roundingPriority: format?.roundingPriority,
  };

  try {
    const roundedValue = Number(getFormatter('en-US', roundingFormatOptions).format(value));
    return Number.isFinite(roundedValue) ? roundedValue : roundToFractionDigits(value, digits);
  } catch {
    return roundToFractionDigits(value, digits);
  }
}

function getDefaultMaximumFractionDigits() {
  return getFormatter('en-US').resolvedOptions().maximumFractionDigits ?? 20;
}

function getMaximumFractionDigits(format?: NumberFormatOptionsWithRounding) {
  // Preserve the old decimal defaults unless min-only precision needs style-specific defaults.
  const minimumFractionDigits = format?.minimumFractionDigits ?? 0;

  if (format?.maximumFractionDigits != null) {
    return Math.max(format.maximumFractionDigits, minimumFractionDigits);
  }

  if (format?.minimumFractionDigits == null) {
    return Math.max(getDefaultMaximumFractionDigits(), 0);
  }

  // Some invalid Intl option combinations throw when constructing the formatter. Rendering usually
  // fails first for those configs, but keep blur-time rounding on the safe decimal fallback.
  try {
    return Math.max(
      getFormatter('en-US', format).resolvedOptions().maximumFractionDigits ?? 20,
      minimumFractionDigits,
    );
  } catch {
    return Math.max(getDefaultMaximumFractionDigits(), minimumFractionDigits);
  }
}

export function removeFloatingPointErrors(value: number, format?: NumberFormatOptionsWithRounding) {
  if (!Number.isFinite(value)) {
    return value;
  }

  const digits = Math.min(Math.max(getMaximumFractionDigits(format), 0), 20);
  const hasSignificantPrecision = hasSignificantDigits(format);
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
    valueToRound = cleanScaledPercentValue(valueToRound, digits);
  }

  if (
    !hasSignificantPrecision &&
    format?.roundingIncrement == null &&
    format?.roundingMode == null &&
    format?.roundingPriority == null
  ) {
    return roundToFractionDigits(valueToRound, digits) / scale;
  }

  return roundWithIntl(valueToRound, digits, format) / scale;
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
