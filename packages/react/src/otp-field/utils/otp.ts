interface OTPValidationConfig {
  pattern: string;
  regexp: RegExp;
  inputMode: 'numeric' | 'text';
}

export type OTPValidationType = 'numeric' | 'alpha' | 'alphanumeric' | 'none';

const OTP_VALIDATION_CONFIG: Record<Exclude<OTPValidationType, 'none'>, OTPValidationConfig> = {
  numeric: {
    pattern: '\\d{1}',
    regexp: /[^\d]/g,
    inputMode: 'numeric',
  },
  alpha: {
    pattern: '[a-zA-Z]{1}',
    regexp: /[^a-zA-Z]/g,
    inputMode: 'text',
  },
  alphanumeric: {
    pattern: '[a-zA-Z0-9]{1}',
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

function removeWhitespace(value: string) {
  return value.replace(/\s/g, '');
}

export function stripOTPWhitespace(value: string | null | undefined) {
  return removeWhitespace(value ?? '');
}

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

  return Array.from(sanitizedValue).slice(0, Math.max(length, 0)).join('');
}

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
