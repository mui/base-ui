import { warn } from '@base-ui/utils/warn';

interface OTPValidationConfig {
  slotPattern: string;
  getRootPattern: (length: number) => string;
  regexp: RegExp;
  inputMode: 'numeric' | 'text';
}

export type OTPValidationType = 'numeric' | 'alpha' | 'alphanumeric' | 'none';

const OTP_VALIDATION_CONFIG: Record<Exclude<OTPValidationType, 'none'>, OTPValidationConfig> = {
  numeric: {
    slotPattern: '\\d{1}',
    getRootPattern: (length) => `\\d{${length}}`,
    regexp: /[^\d]/g,
    inputMode: 'numeric',
  },
  alpha: {
    slotPattern: '[a-zA-Z]{1}',
    getRootPattern: (length) => `[a-zA-Z]{${length}}`,
    regexp: /[^a-zA-Z]/g,
    inputMode: 'text',
  },
  alphanumeric: {
    slotPattern: '[a-zA-Z0-9]{1}',
    getRootPattern: (length) => `[a-zA-Z0-9]{${length}}`,
    regexp: /[^a-zA-Z0-9]/g,
    inputMode: 'text',
  },
};

export function getOTPValidationConfig(validationType: OTPValidationType) {
  if (validationType === 'none') {
    return null;
  }

  return OTP_VALIDATION_CONFIG[validationType];
}

export function stripOTPWhitespace(value: string | null | undefined) {
  return (value ?? '').replace(/\s/g, '');
}

function applyOTPValidation(value: string, validation: OTPValidationConfig | null) {
  return validation ? value.replace(validation.regexp, '') : value;
}

function getStringLength(value: string) {
  return Array.from(value).length;
}

/**
 * Normalizes user-entered OTP text by stripping whitespace, applying validation and custom
 * sanitization, and clamping the final value to the configured slot count.
 */
export function normalizeOTPValueWithDetails(
  value: string | null | undefined,
  length: number,
  validationType: OTPValidationType,
  sanitizeValue?: ((value: string) => string) | undefined,
) {
  const strippedValue = stripOTPWhitespace(value);
  const validation = getOTPValidationConfig(validationType);
  let sanitizedValue = applyOTPValidation(strippedValue, validation);
  let didSanitize = getStringLength(strippedValue) > getStringLength(sanitizedValue);

  if (sanitizeValue) {
    const customSanitizedValue = sanitizeValue(sanitizedValue);

    if (process.env.NODE_ENV !== 'production') {
      if (typeof customSanitizedValue !== 'string') {
        throw new Error(
          'Base UI: <OTPField.Root> `sanitizeValue` must return a string. ' +
            'Returning a non-string value prevents the OTP value from being normalized. ' +
            'Ensure `sanitizeValue` returns the sanitized string.',
        );
      }
    }

    const validatedCustomValue = applyOTPValidation(customSanitizedValue, validation);

    if (process.env.NODE_ENV !== 'production') {
      if (validatedCustomValue !== customSanitizedValue) {
        warn(
          '<OTPField.Root> `sanitizeValue` returned characters that are not allowed by ' +
            '`validationType`. These characters were removed before updating the OTP value. ' +
            'Ensure `sanitizeValue` returns only characters allowed by `validationType`.',
        );
      }
    }

    didSanitize ||= getStringLength(sanitizedValue) > getStringLength(validatedCustomValue);
    sanitizedValue = validatedCustomValue;
  }

  // Slice by Unicode code points so multi-byte characters do not split across OTP slots.
  const clampedValue = Array.from(sanitizedValue).slice(0, Math.max(length, 0)).join('');

  return {
    value: clampedValue,
    didSanitize: didSanitize || getStringLength(sanitizedValue) > getStringLength(clampedValue),
  };
}

export function replaceOTPValueWithDetails(
  currentValue: string,
  index: number,
  nextValue: string,
  length: number,
  validationType: OTPValidationType,
  sanitizeValue?: ((value: string) => string) | undefined,
) {
  const strippedValue = stripOTPWhitespace(nextValue);
  const validation = getOTPValidationConfig(validationType);
  const normalizedValue = applyOTPValidation(strippedValue, validation);
  const prefix = currentValue.slice(0, index);
  const suffix = currentValue.slice(index + normalizedValue.length);
  const nextOTPValue = `${prefix}${normalizedValue}${suffix}`;
  const normalizedDetails = normalizeOTPValueWithDetails(
    nextOTPValue,
    length,
    validationType,
    sanitizeValue,
  );

  return {
    ...normalizedDetails,
    didSanitize:
      normalizedDetails.didSanitize ||
      getStringLength(strippedValue) > getStringLength(normalizedValue),
    insertionLength: Math.max(
      getStringLength(normalizedDetails.value) - getStringLength(prefix) - getStringLength(suffix),
      0,
    ),
  };
}

/**
 * Replaces characters starting at the provided slot index, then re-normalizes the final OTP value
 * so paste and multi-character edits stay contiguous and length-bounded.
 */
export function replaceOTPValue(
  currentValue: string,
  index: number,
  nextValue: string,
  length: number,
  validationType: OTPValidationType,
  sanitizeValue?: ((value: string) => string) | undefined,
) {
  return replaceOTPValueWithDetails(
    currentValue,
    index,
    nextValue,
    length,
    validationType,
    sanitizeValue,
  ).value;
}

export function removeOTPCharacter(currentValue: string, index: number) {
  if (index < 0 || index >= currentValue.length) {
    return currentValue;
  }

  return `${currentValue.slice(0, index)}${currentValue.slice(index + 1)}`;
}
