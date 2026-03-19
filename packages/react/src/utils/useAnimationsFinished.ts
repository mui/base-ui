'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { useAnimationFrame } from '@base-ui/utils/useAnimationFrame';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { resolveRef } from './resolveRef';
import { TransitionStatusDataAttributes } from './stateAttributesMapping';

/**
 * Executes a function once all animations have finished on the provided element.
 * @param elementOrRef - The element to watch for animations.
 * @param waitForStartingStyleRemoved - Whether to wait for [data-starting-style] to be removed before checking for animations.
 * @param treatAbortedAsFinished - Whether to treat aborted animations as finished. If `false`, and there are aborted animations,
 *   the function will check again if any new animations have started and wait for them to finish.
 * @returns A function that takes a callback to execute once all animations have finished, and an optional AbortSignal to abort the callback
 */
export function useAnimationsFinished(
  elementOrRef: React.RefObject<HTMLElement | null> | HTMLElement | null,
  waitForStartingStyleRemoved = false,
  treatAbortedAsFinished = true,
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

      function done() {
        // Synchronously flush the unmounting of the component so that the browser doesn't
        // paint: https://github.com/mui/base-ui/issues/979
        ReactDOM.flushSync(fnToExecute);
      }

      const element = resolveRef(elementOrRef);
      if (element == null) {
        return;
      }
      const resolvedElement = element;

      if (
        typeof resolvedElement.getAnimations !== 'function' ||
        globalThis.BASE_UI_ANIMATIONS_DISABLED
      ) {
        fnToExecute();
      } else {
        function execWaitForStartingStyleRemoved() {
          const startingStyleAttribute = TransitionStatusDataAttributes.startingStyle;

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
        }

        function exec() {
          Promise.all(resolvedElement.getAnimations().map((anim) => anim.finished))
            .then(() => {
              if (signal?.aborted) {
                return;
              }

              done();
            })
            .catch(() => {
              const currentAnimations = resolvedElement.getAnimations();

              if (treatAbortedAsFinished) {
                if (signal?.aborted) {
                  return;
                }

                done();
              } else if (
                !signal?.aborted &&
                currentAnimations.length > 0 &&
                currentAnimations.some((anim) => anim.pending || anim.playState !== 'finished')
              ) {
                // Sometimes animations can be aborted because a property they depend on changes while the animation plays.
                // In such cases, we need to re-check if any new animations have started.
                exec();
              }
            });
        }

        if (waitForStartingStyleRemoved) {
          execWaitForStartingStyleRemoved();
          return;
        }

        frame.request(exec);
      }
    },
  );
}
