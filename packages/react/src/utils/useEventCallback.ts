'use client';
import * as React from 'react';
import { useEnhancedEffect } from './useEnhancedEffect';

type AnyFunction = (...args: any[]) => any;

/**
 * Inspired by https://github.com/facebook/react/issues/14099#issuecomment-440013892
 * See RFC in https://github.com/reactjs/rfcs/pull/220
 */
function useEventCallback<Fn extends AnyFunction>(fn?: Fn) {
  const ref = React.useRef(fn);
  useEnhancedEffect(() => {
    ref.current = fn;
  });
  return React.useCallback<AnyFunction>((...args) => ref.current?.(...args), []) as Fn;
}

export { useEventCallback };
