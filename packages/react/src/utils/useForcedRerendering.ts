'use client';
import * as React from 'react';

/**
 * Returns a function that forces a rerender.
 *
 * @internal
 */
export function useForcedRerendering() {
  const [, setState] = React.useState({});

  return React.useCallback(() => {
    setState({});
  }, []);
}
