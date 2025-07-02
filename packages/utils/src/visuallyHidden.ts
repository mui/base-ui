import * as React from 'react';

export const visuallyHidden: React.CSSProperties = {
  clip: 'rect(0 0 0 0)',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  position: 'fixed',
  top: 0,
  left: 0,
  border: 0,
  padding: 0,
  width: 1,
  height: 1,
  margin: -1,
};
