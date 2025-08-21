'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { useAnimationFrame } from '@base-ui-components/utils/useAnimationFrame';
import { useEventCallback } from '@base-ui-components/utils/useEventCallback';

/**
 * Executes a function once all animations have finished on the provided element.
 * @param elementOrRef - The element to watch for animations.
 * @param waitForNextTick - Whether to wait for the next tick before checking for animations.
 */
export function useAnimationsFinished(
  elementOrRef: React.RefObject<HTMLElement | null> | HTMLElement | null,
  waitForNextTick = false,
) {
  const frame = useAnimationFrame();

  const onAnimationsFinished = useEventCallback(
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

      if (elementOrRef == null) {
        return;
      }

      let element: HTMLElement;
      if ('current' in elementOrRef) {
        if (elementOrRef.current == null) {
          return;
        }

        element = elementOrRef.current;
      } else {
        element = elementOrRef;
      }

      if (typeof element.getAnimations !== 'function' || globalThis.BASE_UI_ANIMATIONS_DISABLED) {
        fnToExecute();
      } else {
        frame.request(() => {
          function exec() {
            if (!element) {
              return;
            }

            Promise.all(element.getAnimations().map((anim) => anim.finished)).then(() => {
              if (signal != null && signal.aborted) {
                return;
              }

              // Synchronously flush the unmounting of the component so that the browser doesn't
              // paint: https://github.com/mui/base-ui/issues/979
              ReactDOM.flushSync(fnToExecute);
            }).catch(() => {
                if (element.getAnimations().length > 0 && element.getAnimations().some((anim) => anim.pending || anim.playState !== 'finished')) {
                // Sometimes animations can be aborted because a property they depend on changes while the animation plays.
                // In such cases, we need to re-check if any new animations have started.
                exec();
              }
            });
          }

          // `open: true` animations need to wait for the next tick to be detected
          if (waitForNextTick) {
            frame.request(exec);
          } else {
            exec();
          }
        });
      }
    },
  );

  return onAnimationsFinished;
}
