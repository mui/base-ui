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

/**
 * Splits an OTP value into its slot characters. Each Unicode code point fills one slot, so
 * characters outside the Basic Multilingual Plane (such as emoji) are not split in half.
 */
export function getOTPCharacters(value: string) {
  return Array.from(value);
}

export function stripOTPWhitespace(value: string | null | undefined) {
  return (value ?? '').replace(/\s/g, '');
}

function applyOTPValidation(value: string, validation: OTPValidationConfig | null) {
  return validation ? value.replace(validation.regexp, '') : value;
}

/**
 * Normalizes user-entered OTP text by stripping whitespace, applying validation and custom
 * normalization, and clamping the final value to the configured slot count.
 */
export function normalizeOTPValueWithDetails(
  value: string | null | undefined,
  length: number,
  validationType: OTPValidationType,
  normalizeValue?: ((value: string) => string) | undefined,
): readonly [value: string, didRejectCharacters: boolean] {
  const strippedValue = stripOTPWhitespace(value);
  const validation = getOTPValidationConfig(validationType);
  let normalizedValue = applyOTPValidation(strippedValue, validation);
  let didRejectCharacters = strippedValue.length > normalizedValue.length;

  if (normalizeValue) {
    const customNormalizedValue = normalizeValue(normalizedValue);
    didRejectCharacters ||= normalizedValue.length > customNormalizedValue.length;
    normalizedValue = applyOTPValidation(customNormalizedValue, validation);
    didRejectCharacters ||= customNormalizedValue.length > normalizedValue.length;
  }

  // Slice by Unicode code points so multi-byte characters do not split across OTP slots.
  const maxLength = length < 0 ? 0 : length;
  const normalizedCharacters = getOTPCharacters(normalizedValue);

  return [
    normalizedCharacters.slice(0, maxLength).join(''),
    didRejectCharacters || normalizedCharacters.length > maxLength,
  ];
}

export function normalizeOTPValue(
  value: string | null | undefined,
  length: number,
  validationType: OTPValidationType,
  normalizeValue?: ((value: string) => string) | undefined,
) {
  return normalizeOTPValueWithDetails(value, length, validationType, normalizeValue)[0];
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
  normalizeValue?: ((value: string) => string) | undefined,
) {
  const normalizedValue = normalizeOTPValue(nextValue, length, validationType, normalizeValue);
  const currentCharacters = getOTPCharacters(currentValue);
  const prefix = currentCharacters.slice(0, index).join('');
  const suffix = currentCharacters.slice(index + getOTPCharacters(normalizedValue).length).join('');

  return normalizeOTPValue(
    `${prefix}${normalizedValue}${suffix}`,
    length,
    validationType,
    normalizeValue,
  );
}

export function removeOTPCharacter(currentValue: string, index: number) {
  const characters = getOTPCharacters(currentValue);

  if (index < 0 || index >= characters.length) {
    return currentValue;
  }

  characters.splice(index, 1);
  return characters.join('');
}
