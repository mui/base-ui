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

export const visuallyHidden: React.CSSProperties = {
  ...visuallyHiddenBase,
  position: 'fixed',
  margin: 0,
  top: 0,
  left: 0,
};

export const visuallyHiddenInput: React.CSSProperties = {
  ...visuallyHiddenBase,
  position: 'absolute',
};

// For hidden inputs without a `name`: `visuallyHidden` at zero size. On a scrollable page, Chrome
// gives every 1px `position: fixed` element its own compositor layer, which slows down every frame
// when many controls render. At zero size it skips the layer. `visuallyHidden` stays 1px because
// screen readers can skip zero-size text, and these inputs are `aria-hidden`.
export const visuallyHiddenInputPinned: React.CSSProperties = {
  ...visuallyHidden,
  width: 0,
  height: 0,
};
