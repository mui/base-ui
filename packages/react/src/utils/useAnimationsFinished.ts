'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { useAnimationFrame } from '@base-ui-components/utils/useAnimationFrame';
import { useEventCallback } from '@base-ui-components/utils/useEventCallback';

/**
 * Executes a function once all animations have finished on the provided element.
 * @param ref - The element to watch for animations.
 * @param waitForNextTick - Whether to wait for the next tick before checking for animations.
 */
export function useAnimationsFinished(
  ref: React.RefObject<HTMLElement | null>,
  waitForNextTick = false,
) {
  const frame = useAnimationFrame();

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

      const element = ref.current;

      if (!element) {
        return;
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
            frame.request(exec);
          } else {
            exec();
          }
        });
      }
    },
  );
}
