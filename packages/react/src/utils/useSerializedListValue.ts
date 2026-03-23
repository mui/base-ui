'use client';
import * as React from 'react';
import { stringifyAsValue } from './resolveValueLabel';

/**
 * Shared hook used by both ListboxRoot and SelectRoot to derive serialized
 * representations of the selected value for form submission.
 *
 * Returns two values:
 * - `serializedValue`: a single string for the hidden `<input>`'s `value` attribute
 *   (empty string when multiple mode has no selection).
 * - `fieldStringValue`: used by `useField` for validation — either a single string
 *   or an array of strings in multiple mode.
 */
export function useSerializedListValue(params: UseSerializedValueParams) {
  const { multiple, value, itemToStringValue } = params;

  const serializedValue = React.useMemo(() => {
    if (multiple && Array.isArray(value) && value.length === 0) {
      return '';
    }
    return stringifyAsValue(value, itemToStringValue);
  }, [multiple, value, itemToStringValue]);

  const fieldStringValue = React.useMemo(() => {
    if (multiple && Array.isArray(value)) {
      return value.map((currentValue) => stringifyAsValue(currentValue, itemToStringValue));
    }
    return stringifyAsValue(value, itemToStringValue);
  }, [multiple, value, itemToStringValue]);

  return { serializedValue, fieldStringValue };
}

interface UseSerializedValueParams {
  multiple: boolean;
  value: any;
  itemToStringValue: ((item: any) => string) | undefined;
}
