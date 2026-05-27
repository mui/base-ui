import { clamp } from '../../internals/clamp';
import { getFormatter } from '../../utils/formatNumber';
import { parseNumber } from './parse';

const STEP_EPSILON_FACTOR = 1e-10;
// Matches Intl.NumberFormat's decimal maximumFractionDigits default.
const DEFAULT_DIGITS = 3;

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

export function removeFloatingPointErrors(value: number, format?: NumberFormatOptionsWithRounding) {
  if (!Number.isFinite(value)) {
    return value;
  }

  if (!hasNumberFormatRoundingOptions(format)) {
    return Number(value.toFixed(DEFAULT_DIGITS));
  }

  const formatter = getFormatter('en-US', {
    ...format,
    // These options alter only display decoration, not numeric rounding.
    signDisplay: 'auto',
    currencySign: 'standard',
    notation: format.notation === 'compact' ? 'standard' : format.notation,
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
