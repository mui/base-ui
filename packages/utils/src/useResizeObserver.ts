'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from './useIsoLayoutEffect';
import { AnimationFrame } from './useAnimationFrame';

const isDevEnvironment = process.env.NODE_ENV !== 'production';

const noop = () => {};

export function useResizeObserver(
  ref: React.RefObject<HTMLElement | undefined | null>,
  fn: (entries: ResizeObserverEntry[]) => void,
  enabled?: boolean,
) {
  const fnRef = React.useRef(null as unknown as typeof fn);
  fnRef.current = fn;

  useIsoLayoutEffect(() => {
    if (enabled === false || typeof ResizeObserver === 'undefined') {
      return noop;
    }

    let frameID = 0;

    const target = ref.current;
    const observer = new ResizeObserver((entries) => {
      // See https://github.com/mui/mui-x/issues/8733
      // In dev, we avoid the React warning by moving the task to the next frame.
      // In prod, we want the task to run in the same frame as to avoid tear.
      if (isDevEnvironment) {
        frameID = AnimationFrame.request(() => {
          fnRef.current(entries);
        });
      } else {
        fnRef.current(entries);
      }
    });

    if (target) {
      observer.observe(target);
    }

    return () => {
      if (frameID) {
        AnimationFrame.cancel(frameID);
      }

      observer.disconnect();
    };
  }, [ref, enabled]);
}
