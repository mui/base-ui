import type * as React from 'react';

const visuallyHiddenBase: React.CSSProperties = {
  clipPath: 'inset(50%)',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  border: 0,
  padding: 0,
  width: 1,
  height: 1,
  margin: -1,
};

// Just above the viewport: many 1px fixed elements inside it can make Chrome drop frames.
export const visuallyHidden: React.CSSProperties = {
  ...visuallyHiddenBase,
  position: 'fixed',
  margin: 0,
  top: -1,
  left: 0,
};

export const visuallyHiddenInput: React.CSSProperties = {
  ...visuallyHiddenBase,
  position: 'absolute',
};

// Unnamed hidden inputs: zero size so Chrome doesn't give each one a compositor layer. On screen
// so the native validation message shows once they grow to 1px on `invalid`.
export const visuallyHiddenInputPinned: React.CSSProperties = {
  ...visuallyHidden,
  width: 0,
  height: 0,
  top: 0,
};
