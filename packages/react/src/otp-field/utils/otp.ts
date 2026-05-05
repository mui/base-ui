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

/**
 * Normalizes user-entered OTP text by stripping whitespace, applying validation or custom
 * sanitization, and clamping the final value to the configured slot count.
 */
export function normalizeOTPValue(
  value: string | null | undefined,
  length: number,
  validationType: OTPValidationType,
  sanitizeValue?: ((value: string) => string) | undefined,
) {
  let sanitizedValue = stripOTPWhitespace(value);
  const validation = getOTPValidationConfig(validationType);

  if (validation) {
    sanitizedValue = sanitizedValue.replace(validation.regexp, '');
  } else if (sanitizeValue) {
    sanitizedValue = sanitizeValue(sanitizedValue);
  }

  // Slice by Unicode code points so multi-byte characters do not split across OTP slots.
  return Array.from(sanitizedValue).slice(0, Math.max(length, 0)).join('');
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
  const normalizedValue = normalizeOTPValue(nextValue, length, validationType, sanitizeValue);
  const prefix = currentValue.slice(0, index);
  const suffix = currentValue.slice(index + normalizedValue.length);

  return normalizeOTPValue(
    `${prefix}${normalizedValue}${suffix}`,
    length,
    validationType,
    sanitizeValue,
  );
}

export function removeOTPCharacter(currentValue: string, index: number) {
  if (index < 0 || index >= currentValue.length) {
    return currentValue;
  }

  return `${currentValue.slice(0, index)}${currentValue.slice(index + 1)}`;
}
