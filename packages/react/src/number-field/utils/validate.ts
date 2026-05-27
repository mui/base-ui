import { clamp } from '../../internals/clamp';
import { getFormatter } from '../../utils/formatNumber';
import { parseNumber } from './parse';

const STEP_EPSILON_FACTOR = 1e-10;
// Matches Intl.NumberFormat's decimal maximumFractionDigits default.
const DEFAULT_DIGITS = 3;
const PERCENT_SCALE = 100;
const PERCENT_SCALE_DIGITS = 2;
// Extra decimal places used to scrub percent-scale float noise without dropping user precision.
const PERCENT_GUARD_DIGITS = 10;

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

function isScientificOrEngineering(format: NumberFormatOptionsWithRounding) {
  return format.notation === 'scientific' || format.notation === 'engineering';
}

function roundWithPlainNumberFormat(value: number, format: NumberFormatOptionsWithRounding) {
  const resolvedOptions = getFormatter('en-US', format).resolvedOptions();
  const digits = Math.min(
    format.maximumFractionDigits ?? resolvedOptions.maximumFractionDigits ?? DEFAULT_DIGITS,
    20,
  );
  const precision = Math.max(
    digits,
    format.maximumSignificantDigits ?? resolvedOptions.maximumSignificantDigits ?? 0,
  );

  // Percent values are stored as fractions, so rounding must happen at the displayed scale.
  const scale = format.style === 'percent' ? PERCENT_SCALE : 1;
  let valueToRound = value * scale;

  if (!Number.isFinite(valueToRound)) {
    // Percent scaling can overflow for extreme finite values; fall back to the unscaled value.
    return value;
  }

  if (scale > 1) {
    // Directional Intl rounding has no tolerance for the binary noise introduced by `value * 100`.
    valueToRound = Number(valueToRound.toFixed(Math.min(precision + PERCENT_GUARD_DIGITS, 20)));
  }

  const roundedText = getFormatter('en-US', {
    // Keep style/unit/compact notation out so the formatted string parses back as a plain number.
    useGrouping: false,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    minimumSignificantDigits: format.minimumSignificantDigits,
    maximumSignificantDigits: format.maximumSignificantDigits,
    roundingIncrement: format.roundingIncrement,
    roundingMode: format.roundingMode,
    roundingPriority: format.roundingPriority,
  } as NumberFormatOptionsWithRounding).format(valueToRound);

  const roundedValue = Number(roundedText);

  if (!Number.isFinite(roundedValue)) {
    return value;
  }

  if (scale > 1) {
    const scaledValue = Number(`${roundedText}e-${PERCENT_SCALE_DIGITS}`);
    return Number.isFinite(scaledValue) ? scaledValue : roundedValue / scale;
  }

  return roundedValue;
}

export function removeFloatingPointErrors(value: number, format?: NumberFormatOptionsWithRounding) {
  if (!Number.isFinite(value)) {
    return value;
  }

  if (!hasNumberFormatRoundingOptions(format)) {
    return Number(value.toFixed(DEFAULT_DIGITS));
  }

  if (format.notation === 'compact') {
    return roundWithPlainNumberFormat(value, format);
  }

  const formatter = getFormatter('en-US', {
    ...format,
    useGrouping: false,
  } as NumberFormatOptionsWithRounding);
  const roundedText = formatter.format(value);
  const roundedValue = parseNumber(roundedText, 'en-US', format);

  if (roundedValue === null) {
    return value;
  }

  if (
    roundedValue === 0 &&
    value !== 0 &&
    isScientificOrEngineering(format) &&
    formatter.formatToParts(value).some((part) => part.type === 'exponentSeparator')
  ) {
    return value;
  }

  return roundedValue;
}

function snapToStep(
  value: number,
  base: number,
  step: number,
  mode: 'directional' | 'nearest' = 'directional',
) {
  const stepSize = Math.abs(step);
  const direction = Math.sign(step);
  const tolerance = stepSize * STEP_EPSILON_FACTOR * direction;
  const rawSteps = value - base + tolerance;

  if (mode === 'nearest') {
    return base + Math.round(rawSteps / step) * step;
  }

  const snappedSteps =
    direction > 0 ? Math.floor(rawSteps / stepSize) : Math.ceil(rawSteps / stepSize);
  return base + snappedSteps * stepSize;
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
