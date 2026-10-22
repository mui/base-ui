'use client';
import type * as React from 'react';
import * as ReactDOM from 'react-dom';
import { useAnimationFrame } from '@base-ui/utils/useAnimationFrame';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { NOOP } from '@base-ui/utils/empty';
import { resolveRef } from '../utils/resolveRef';
import { getFiniteAnimations } from '../utils/getFiniteAnimations';
import * as TransitionStatusDataAttributes from './TransitionStatusDataAttributes';
import { createFlushBeforePaint } from './createFlushBeforePaint';

const flushBeforePaint = createFlushBeforePaint();

/**
 * Executes a function once all animations have finished on the provided element.
 * If an animation is canceled, waits for any replacement animations before executing.
 * @param elementOrRef - The element to watch for animations.
 * @param waitForStartingStyleRemoved - Whether to wait for [data-starting-style] to be removed before checking for animations.
 * @param batch - Whether completions ready in the same microtask may be coalesced into a single
 * commit. A batched callback runs before earlier callbacks' React updates have committed, so only
 * opt in when the callback doesn't read state that another completion can change.
 * @param subtree - Whether to also wait for the animations of descendants, including descendants
 * whose transitions start when their [data-starting-style] is removed.
 * @returns A function that takes a callback to execute once all animations have finished, and an optional AbortSignal to abort the callback
 */
export function useAnimationsFinished(
  elementOrRef: React.RefObject<HTMLElement | null> | HTMLElement | null,
  waitForStartingStyleRemoved = false,
  batch = false,
  subtree = false,
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
        if (!batch) {
          // Synchronously flush the unmounting of the component so that the browser doesn't
          // paint: https://github.com/mui/base-ui/issues/979
          // Each callback gets its own commit so that later completions observe the React
          // updates caused by earlier ones.
          ReactDOM.flushSync(fnToExecute);
          return;
        }

        flushBeforePaint(() => {
          // Re-check at flush time: the signal may abort between queueing and the flush.
          if (!signal?.aborted) {
            fnToExecute();
          }
        });
      };

      if (
        typeof resolvedElement.getAnimations !== 'function' ||
        globalThis.BASE_UI_ANIMATIONS_DISABLED
      ) {
        fnToExecute();
        return;
      }

      const startingStyleAttribute = TransitionStatusDataAttributes.startingStyle;
      const startingStyleSelector = `[${startingStyleAttribute}]`;

      function exec() {
        // Reading the animations updates styles. Descendants in their starting style then get
        // that style before it is removed, so their transitions can start.
        const animations = getFiniteAnimations(resolvedElement, { subtree });

        if (subtree && resolvedElement.querySelector(startingStyleSelector)) {
          if (signal?.aborted) {
            return;
          }

          // A descendant's transition starts only after its starting style is removed.
          const subtreeObserver = new MutationObserver(() => {
            if (!resolvedElement.querySelector(startingStyleSelector)) {
              subtreeObserver.disconnect();
              exec();
            }
          });

          subtreeObserver.observe(resolvedElement, {
            attributes: true,
            attributeFilter: [startingStyleAttribute],
            childList: true,
            subtree: true,
          });

          signal?.addEventListener('abort', () => subtreeObserver.disconnect(), { once: true });
          return;
        }

        // Discard fulfilled Animation values so unfinished animations cannot retain their targets.
        Promise.all(animations.map((animation) => animation.finished.then(NOOP))).then(
          () => {
            if (!signal?.aborted) {
              done();
            }
          },
          () => {
            if (signal?.aborted) {
              return;
            }

            const currentAnimations = getFiniteAnimations(resolvedElement, { subtree });

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
