import type * as React from 'react';

const visuallyHiddenBase: React.CSSProperties = {
  clipPath: 'inset(50%)',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  border: '0px',
  padding: '0px',
  width: '1px',
  height: '1px',
  margin: '-1px',
};

export const visuallyHidden: React.CSSProperties = {
  ...visuallyHiddenBase,
  position: 'fixed',
  top: '0px',
  left: '0px',
};

export const visuallyHiddenInput: React.CSSProperties = {
  ...visuallyHiddenBase,
  position: 'absolute',
};
