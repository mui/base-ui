import { clamp } from '../../internals/clamp';
import { getFormatter } from '../../utils/formatNumber';
import { parseNumber } from './parse';

const FLOATING_POINT_TOLERANCE = 1e-10;
const FLOATING_POINT_CLEANUP_EPSILON_FACTOR = 4;

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

  if (!hasNumberFormatRoundingOptions(format)) {
    // Clean binary floating-point noise (e.g. `0.1 + 0.2`) without discarding legitimate
    // precision. Integer Number values are already integral as stored, so returning them
    // verbatim avoids corrupting large integer values that `toPrecision(15)` would change.
    if (Number.isInteger(value)) {
      return value;
    }

    const roundedValue = parseFloat(value.toPrecision(15));
    const cleanupDelta = Math.abs(roundedValue - value);
    const cleanupTolerance = Math.min(
      Number.EPSILON * Math.max(1, Math.abs(value)) * FLOATING_POINT_CLEANUP_EPSILON_FACTOR,
      FLOATING_POINT_TOLERANCE,
    );

    return cleanupDelta <= cleanupTolerance ? roundedValue : value;
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

  return formatter.format(roundedValue) === roundedText ? roundedValue : value;
}

function snapToStep(
  value: number,
  base: number,
  step: number,
  mode: 'directional' | 'nearest' = 'directional',
) {
  const stepSize = Math.abs(step);
  const direction = Math.sign(step);
  const tolerance = stepSize * FLOATING_POINT_TOLERANCE * direction;
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

  // Parsed input (typing, paste, blur) involves no arithmetic, so it carries no binary
  // noise to clean — return it verbatim to keep every typed digit, including values with
  // more than 15 significant digits. Stepping and snapping arithmetic can introduce noise
  // (e.g. 0.7 + 0.1), which `removeFloatingPointErrors` cleans.
  if (step == null && !hasNumberFormatRoundingOptions(format)) {
    return nextValue;
  }

  const roundedValue = removeFloatingPointErrors(nextValue, format);
  return shouldClamp ? clamp(roundedValue, minWithDefault, maxWithDefault) : roundedValue;
}
