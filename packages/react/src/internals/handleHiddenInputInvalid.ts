import type * as React from 'react';

/**
 * Chrome doesn't show the native validation message for a zero-size input, which a hidden input
 * without a `name` is (`visuallyHiddenInputPinned`). The browser fires `invalid` right before it
 * shows the message, so grow the input to 1px there. Only inputs that failed validation pay for
 * the compositor layer a 1px fixed input gets. Inputs that are already 1px don't change.
 */
export function handleHiddenInputInvalid(event: React.FormEvent<HTMLInputElement>) {
  const { style } = event.currentTarget;
  style.width = '1px';
  style.height = '1px';
}
