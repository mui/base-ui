export function normalizeOTPValue(value: string | null | undefined, length: number) {
  return Array.from(value ?? '')
    .filter((character) => character >= '0' && character <= '9')
    .slice(0, Math.max(1, length))
    .join('');
}

export function replaceOTPValue(
  currentValue: string,
  index: number,
  nextValue: string,
  length: number,
) {
  const normalizedValue = normalizeOTPValue(nextValue, length);
  const prefix = currentValue.slice(0, index);
  const suffix = currentValue.slice(index + normalizedValue.length);

  return normalizeOTPValue(`${prefix}${normalizedValue}${suffix}`, length);
}

export function removeOTPCharacter(currentValue: string, index: number) {
  if (index < 0 || index >= currentValue.length) {
    return currentValue;
  }

  return `${currentValue.slice(0, index)}${currentValue.slice(index + 1)}`;
}
