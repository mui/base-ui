export function serializeValue(value: unknown): string {
  if (value == null) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function stringifyAsDefaultLabel(value: unknown): string {
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (record.label != null) {
      return String(record.label);
    }
    if ('value' in record) {
      return String(record.value);
    }
  }
  return serializeValue(value);
}
