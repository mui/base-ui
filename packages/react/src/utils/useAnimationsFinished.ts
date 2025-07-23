'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { useAnimationFrame } from '@base-ui-components/utils/useAnimationFrame';
import { useTimeout } from '@base-ui-components/utils/useTimeout';
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
  const timeout = useTimeout();

  return useEventCallback(
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
      timeout.clear();

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

            Promise.allSettled(element.getAnimations().map((anim) => anim.finished)).then(() => {
              if (signal != null && signal.aborted) {
                return;
              }
              // Synchronously flush the unmounting of the component so that the browser doesn't
              // paint: https://github.com/mui/base-ui/issues/979
              ReactDOM.flushSync(fnToExecute);
            });
          }

          // `open: true` animations need to wait for the next tick to be detected
          if (waitForNextTick) {
            timeout.start(0, exec);
          } else {
            exec();
          }
        });
      }
    },
  );
}
