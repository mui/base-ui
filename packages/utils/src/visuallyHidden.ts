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

// For hidden inputs without a `name`: pinned to the containing block's corner like
// `visuallyHidden`, but not `position: fixed`, as Chrome gives every fixed element its own
// compositor layer on a scrollable page, which slows down every frame when many controls render.
export const visuallyHiddenInputPinned: React.CSSProperties = {
  ...visuallyHidden,
  position: 'absolute',
};
