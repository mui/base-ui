'use client';
import type * as React from 'react';
import * as ReactDOM from 'react-dom';
import { useAnimationFrame } from '@base-ui/utils/useAnimationFrame';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { NOOP } from '@base-ui/utils/empty';
import { resolveRef } from '../utils/resolveRef';
import { isFiniteAnimation } from '../utils/getFiniteAnimations';
import * as TransitionStatusDataAttributes from './TransitionStatusDataAttributes';

/**
 * Returns a function that queues items and flushes them together in a microtask.
 */
function createMicrotaskQueue<T>(flush: (items: T[]) => void) {
  let pending: T[] | null = null;
  return (item: T) => {
    if (!pending) {
      const items: T[] = [];
      pending = items;
      queueMicrotask(() => {
        pending = null;
        flush(items);
      });
    }
    pending.push(item);
  };
}

/**
 * Passes each element's animations to its callback in a microtask.
 * In Blink, `element.getAnimations()` returns early for an element without animations, but
 * otherwise sorts every animation in the tree. Once an element with animations is found, the
 * remaining elements of its tree are served by a single `getAnimations()` call on the tree's root.
 */
const getAnimationsBatched = createMicrotaskQueue<
  [element: Element, callback: (animations: Animation[]) => void]
>((lookups) => {
  const animationsByElement = new Map<Element, Animation[]>();
  let animatedRoot: (Node & Partial<DocumentOrShadowRoot>) | undefined;
  let animationsByTarget: Map<Element | null, Animation[]> | undefined;

  for (const [element, callback] of lookups) {
    let animations = animationsByElement.get(element);
    if (!animations) {
      const root: Node & Partial<DocumentOrShadowRoot> = element.getRootNode();
      if (root === animatedRoot && !animationsByTarget) {
        animationsByTarget = new Map();
        for (const animation of root.getAnimations!()) {
          const effect = animation.effect as KeyframeEffect;
          // `element.getAnimations()` excludes animations of the element's pseudo-elements.
          if (!effect.pseudoElement) {
            animationsByTarget.set(effect.target, [
              ...(animationsByTarget.get(effect.target) ?? []),
              animation,
            ]);
          }
        }
      }
      animations =
        root === animatedRoot ? (animationsByTarget!.get(element) ?? []) : element.getAnimations();
      if (animations.length && element.isConnected && root.getAnimations) {
        animatedRoot ??= root;
      }
      animationsByElement.set(element, animations);
    }
    callback(animations);
  }
});

/**
 * Runs the callback in a synchronous flush before the browser paints, so that the
 * browser doesn't paint an intermediate frame: https://github.com/mui/base-ui/issues/979
 * Callbacks that become ready within the same microtask checkpoint (e.g. multiple elements
 * whose animations finish together) are batched into a single commit:
 * https://github.com/mui/base-ui/issues/5481
 */
const flushBeforePaint = createMicrotaskQueue<() => void>((callbacks) => {
  ReactDOM.flushSync(() => {
    for (const callback of callbacks) {
      callback();
    }
  });
});

/**
 * Executes a function once all animations have finished on the provided element.
 * If an animation is canceled, waits for any replacement animations before executing.
 * @param elementOrRef - The element to watch for animations.
 * @param waitForStartingStyleRemoved - Whether to wait for [data-starting-style] to be removed before checking for animations.
 * @param batch - Whether completions ready in the same microtask may be coalesced into a single
 * commit. A batched callback runs before earlier callbacks' React updates have committed, so only
 * opt in when the callback doesn't read state that another completion can change.
 * @returns A function that takes a callback to execute once all animations have finished, and an optional AbortSignal to abort the callback
 */
export function useAnimationsFinished(
  elementOrRef: React.RefObject<HTMLElement | null> | HTMLElement | null,
  waitForStartingStyleRemoved = false,
  batch = false,
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

      function exec() {
        getAnimationsBatched([resolvedElement, waitForAnimations]);
      }

      function waitForAnimations(animations: Animation[]) {
        // Discard fulfilled Animation values so unfinished animations cannot retain their targets.
        Promise.all(
          animations.filter(isFiniteAnimation).map((animation) => animation.finished.then(NOOP)),
        ).then(
          () => {
            if (!signal?.aborted) {
              done();
            }
          },
          () => {
            // Sometimes animations can be aborted because a property they depend on changes while
            // the animation plays. Wait for the element's current animations, which include any
            // replacement.
            if (!signal?.aborted) {
              exec();
            }
          },
        );
      }

      if (waitForStartingStyleRemoved) {
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
        return;
      }

      frame.request(exec);
    },
  );
}
