import * as React from 'react';

export const visuallyHidden: React.CSSProperties = {
  border: 0,
  clip: 'rect(0 0 0 0)',
  height: '1px',
  margin: '-1px',
  overflow: 'hidden',
  padding: 0,
  position: 'fixed',
  top: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: '1px',
};
