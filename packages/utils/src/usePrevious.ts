import * as React from 'react';

/**
 * Returns a value from the previous render.
 * @param value Current value.
 */
export function usePrevious<T>(value: T): T | null {
  const ref = React.useRef<T | null>(null);
  React.useEffect(() => {
    ref.current = value;
  });

  return ref.current;
}
