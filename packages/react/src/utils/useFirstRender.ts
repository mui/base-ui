import * as React from 'react';

export function useFirstRender(fn: Function) {
  const ref = React.useRef(true);
  if (ref.current) {
    ref.current = false;
    fn();
  }
}
