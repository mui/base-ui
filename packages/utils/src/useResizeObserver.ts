'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from './useIsoLayoutEffect';
import { useRefWithInit } from './useRefWithInit';
import { useOnMount } from './useOnMount';
import { AnimationFrame } from './useAnimationFrame';

const isDevEnvironment = process.env.NODE_ENV !== 'production';

interface ObserverState {
  observer: ResizeObserver | null;
  target: HTMLElement | null;
  frameID: number;
}

function createObserverState(): ObserverState {
  return { observer: null, target: null, frameID: 0 };
}

/**
 * Observes size changes of the element held by `ref`.
 *
 * `fn` is read from a ref, so the latest one is always called and it never
 * needs to be stable. In development the callback is deferred to the next
 * animation frame to avoid a React warning; in production it runs in the same
 * frame to avoid tearing (see mui/mui-x#8733).
 */
export function useResizeObserver(
  ref: React.RefObject<HTMLElement | undefined | null>,
  fn: (entries: ResizeObserverEntry[]) => void,
  enabled?: boolean,
) {
  const fnRef = React.useRef(null as unknown as typeof fn);
  fnRef.current = fn;

  const state = useRefWithInit(createObserverState).current;

  // Deliberately no dependency array. Refs are populated before layout effects
  // run, so re-reading after every render is what picks up an element that
  // mounts later (a conditionally rendered target) or is swapped for another
  // one — `ref` itself never changes identity, so a dependency on it can only
  // ever fire once.
  useIsoLayoutEffect(() => {
    const target = enabled === false ? null : (ref.current ?? null);

    if (target === state.target) {
      return;
    }

    state.target = target;
    state.observer?.disconnect();
    state.observer = null;

    if (target === null || typeof ResizeObserver === 'undefined') {
      return;
    }

    state.observer = new ResizeObserver((entries) => {
      if (isDevEnvironment) {
        state.frameID = AnimationFrame.request(() => {
          fnRef.current(entries);
        });
      } else {
        fnRef.current(entries);
      }
    });
    state.observer.observe(target);
  });

  useOnMount(() => () => {
    if (state.frameID) {
      AnimationFrame.cancel(state.frameID);
      state.frameID = 0;
    }
    state.observer?.disconnect();
    state.observer = null;
    state.target = null;
  });
}
