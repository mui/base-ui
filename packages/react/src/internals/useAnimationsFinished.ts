'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { useAnimationFrame } from '@base-ui/utils/useAnimationFrame';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { resolveRef } from '../utils/resolveRef';

interface PendingCallback {
  fn: () => void;
  signal: AbortSignal | null;
}

let pendingCallbacks: PendingCallback[] | null = null;

/**
 * Runs the callback in a synchronous flush before the browser paints, so that the
 * browser doesn't paint an intermediate frame: https://github.com/mui/base-ui/issues/979
 * Callbacks that become ready within the same microtask checkpoint (e.g. multiple elements
 * whose animations finish together) are batched into a single commit:
 * https://github.com/mui/base-ui/issues/5481
 */
function flushBeforePaint(fn: () => void, signal: AbortSignal | null) {
  if (pendingCallbacks === null) {
    const callbacks: PendingCallback[] = [];
    pendingCallbacks = callbacks;
    queueMicrotask(() => {
      pendingCallbacks = null;
      ReactDOM.flushSync(() => {
        for (const callback of callbacks) {
          if (!callback.signal?.aborted) {
            callback.fn();
          }
        }
      });
    });
  }
  pendingCallbacks.push({ fn, signal });
}

/**
 * Executes a function once all animations have finished on the provided element.
 * If an animation is canceled, waits for any replacement animations before executing.
 * @param elementOrRef - The element to watch for animations.
 * @param waitForStartingStyleRemoved - Whether to wait for [data-starting-style] to be removed before checking for animations.
 * @returns A function that takes a callback to execute once all animations have finished, and an optional AbortSignal to abort the callback
 */
export function useAnimationsFinished(
  elementOrRef: React.RefObject<HTMLElement | null> | HTMLElement | null,
  waitForStartingStyleRemoved = false,
) {
  const frame = useAnimationFrame();

  return useStableCallback(
    (
      /**
       * A function to execute once all animations have finished.
       */
      fnToExecute: () => void,
      /**
       * An optional [AbortSignal](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal) that
       * can be used to abort `fnToExecute` before all the animations have finished.
       * @default null
       */
      signal: AbortSignal | null = null,
    ) => {
      frame.cancel();

      const element = resolveRef(elementOrRef);
      if (element == null) {
        return;
      }

      const resolvedElement = element;

      const done = () => {
        flushBeforePaint(fnToExecute, signal);
      };

      if (
        typeof resolvedElement.getAnimations !== 'function' ||
        globalThis.BASE_UI_ANIMATIONS_DISABLED
      ) {
        fnToExecute();
        return;
      }

      function exec() {
        Promise.all(resolvedElement.getAnimations().map((animation) => animation.finished)).then(
          () => {
            if (!signal?.aborted) {
              done();
            }
          },
          () => {
            if (signal?.aborted) {
              return;
            }

            const currentAnimations = resolvedElement.getAnimations();

            if (
              currentAnimations.some(
                (animation) => animation.pending || animation.playState !== 'finished',
              )
            ) {
              // Sometimes animations can be aborted because a property they depend on changes while the animation plays.
              // In such cases, we need to re-check if any new animations have started.
              exec();
              return;
            }

            done();
          },
        );
      }

      if (waitForStartingStyleRemoved) {
        const startingStyleAttribute = 'data-starting-style';

        // If `[data-starting-style]` isn't present, fall back to waiting one more frame
        // to give "open" animations a chance to be registered.
        if (!resolvedElement.hasAttribute(startingStyleAttribute)) {
          frame.request(exec);
          return;
        }

        // Wait for `[data-starting-style]` to have been removed.
        const attributeObserver = new MutationObserver(() => {
          if (!resolvedElement.hasAttribute(startingStyleAttribute)) {
            attributeObserver.disconnect();
            exec();
          }
        });

        attributeObserver.observe(resolvedElement, {
          attributes: true,
          attributeFilter: [startingStyleAttribute],
        });

        signal?.addEventListener('abort', () => attributeObserver.disconnect(), { once: true });
        return;
      }

      frame.request(exec);
    },
  );
}
