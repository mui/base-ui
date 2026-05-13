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

/**
 * Normalizes user-entered OTP text by stripping whitespace, applying validation and custom
 * sanitization, and clamping the final value to the configured slot count.
 */
export function normalizeOTPValueWithDetails(
  value: string | null | undefined,
  length: number,
  validationType: OTPValidationType,
  sanitizeValue?: ((value: string) => string) | undefined,
): readonly [value: string, didSanitize: boolean] {
  const strippedValue = stripOTPWhitespace(value);
  const validation = getOTPValidationConfig(validationType);
  let sanitizedValue = applyOTPValidation(strippedValue, validation);
  let didSanitize = strippedValue.length > sanitizedValue.length;

  if (sanitizeValue) {
    const customSanitizedValue = sanitizeValue(sanitizedValue);
    didSanitize ||= sanitizedValue.length > customSanitizedValue.length;
    sanitizedValue = applyOTPValidation(customSanitizedValue, validation);
    didSanitize ||= customSanitizedValue.length > sanitizedValue.length;
  }

  // Slice by Unicode code points so multi-byte characters do not split across OTP slots.
  const maxLength = length < 0 ? 0 : length;
  const sanitizedCharacters = Array.from(sanitizedValue);

  return [
    sanitizedCharacters.slice(0, maxLength).join(''),
    didSanitize || sanitizedCharacters.length > maxLength,
  ];
}

export function normalizeOTPValue(
  value: string | null | undefined,
  length: number,
  validationType: OTPValidationType,
  sanitizeValue?: ((value: string) => string) | undefined,
) {
  return normalizeOTPValueWithDetails(value, length, validationType, sanitizeValue)[0];
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
