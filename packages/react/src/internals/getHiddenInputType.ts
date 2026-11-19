import type * as React from 'react';

/**
 * The visually hidden input of a control without a native input (Select, Combobox) is only needed
 * for submission, constraint validation, autofill, Field validation or focus via `inputRef`.
 * Otherwise it can be `type="hidden"`, which password managers skip instead of treating each one
 * as a form field and rescanning the page whenever one is added or removed.
 */
export function getHiddenInputType(
  inField: boolean,
  name: string | undefined,
  autoComplete: string | undefined,
  required: boolean,
  inputRef: React.Ref<HTMLInputElement> | undefined,
) {
  return inField || name || autoComplete || required || inputRef ? undefined : 'hidden';
}
