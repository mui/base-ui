import * as React from 'react';
import { useRef } from '@base-ui/utils/useRef';

export function useOnFirstRender(fn: Function) {
  const ref = useRef(true);
  if (ref.current) {
    ref.current = false;
    fn();
  }
}
