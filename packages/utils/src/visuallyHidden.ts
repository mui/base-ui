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
// when many controls render. At zero size it skips the layer. It stays `fixed` so focusing it
// (label clicks, native validation) never scrolls the page. Chrome doesn't show the native
// validation message for a zero-size input, so grow it to 1px on `invalid`.
// `visuallyHidden` stays 1px because screen readers can skip zero-size text. These inputs are
// `aria-hidden`, so zero size is safe for them.
export const visuallyHiddenInputPinned: React.CSSProperties = {
  ...visuallyHidden,
  width: 0,
  height: 0,
};
