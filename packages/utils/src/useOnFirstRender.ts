import * as React from 'react';
import { useRef } from './useRef';

export function useOnFirstRender(fn: Function) {
  const ref = useRef(true);
  if (ref.current) {
    ref.current = false;
    fn();
  }
}
