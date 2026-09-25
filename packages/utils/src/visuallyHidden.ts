import type * as React from 'react';

const visuallyHiddenBase: React.CSSProperties = {
  clipPath: 'inset(50%)',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  border: '0',
  padding: '0',
  width: '1px',
  height: '1px',
  margin: '-1px',
};

export const visuallyHidden: React.CSSProperties = {
  ...visuallyHiddenBase,
  position: 'fixed',
  margin: '0',
  top: '0',
  left: '0',
};

export const visuallyHiddenInput: React.CSSProperties = {
  ...visuallyHiddenBase,
  position: 'absolute',
};
