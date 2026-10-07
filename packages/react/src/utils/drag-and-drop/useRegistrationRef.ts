'use client';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import type { DragCleanupFn } from './types';

/**
 * Returns a stable ref callback that registers the attached element, and
 * unregisters it when the node detaches or is replaced. `register` is read at
 * call time, so it can close over the latest props without recreating the callback.
 *
 * The callback returns `void`, not a `React.RefCallback` cleanup. It keeps its
 * own cleanup, so calling it directly to re-register loses nothing. The narrower
 * type is still assignable wherever a ref callback is expected.
 *
 * A detach followed by a re-attach of the same node within one commit keeps the
 * registration. React does that whenever a merged ref changes identity, for
 * example with an inline `ref={() => {}}`. Re-registering mid-drag would make a
 * hovered target leave and re-enter, and a handler that sets state would render
 * another new ref and do it again, forever. Calling the callback directly with an
 * element still tears down and re-registers.
 */
export function useRegistrationRef<TElement extends Element>(
  register: (element: TElement) => DragCleanupFn,
): (element: TElement | null) => void {
  const registerStable = useStableCallback(register);
  const registration = useRefWithInit(() => {
    let current: { node: TElement; cleanup: DragCleanupFn } | null = null;
    // Set by a detach until the end of its commit, while React may still re-attach
    // the same node.
    let pendingDetach = false;
    // Cleared when a second detach arrives first, for example from a direct call
    // made while the node is detached. The node then re-registers when it returns.
    let reattachable = false;
    let mounted = false;

    function teardown() {
      pendingDetach = false;
      const previous = current;
      current = null;
      previous?.cleanup();
    }

    function flush() {
      if (pendingDetach) {
        teardown();
      }
    }

    function ref(element: TElement | null) {
      if (element === null) {
        // On unmount, React runs this component's layout effect cleanups before it
        // detaches the refs below it, so `mounted` is already false and the
        // teardown stays synchronous.
        if (!mounted || current === null) {
          teardown();
        } else if (pendingDetach) {
          reattachable = false;
        } else {
          pendingDetach = true;
          reattachable = true;
          // The layout effect below flushes it when this component rendered. A
          // detach from a descendant's own render, such as a `render` component
          // that unmounts its element, runs no effect here.
          queueMicrotask(flush);
        }
        return;
      }
      if (pendingDetach && reattachable && element === current?.node) {
        pendingDetach = false;
        return;
      }
      teardown();
      // `useStableCallback` publishes the current closure during the commit,
      // before refs attach. An abandoned or suspended render therefore can't leak
      // its registration parameters, as it could with a ref written during render.
      current = { node: element, cleanup: registerStable(element) };
    }

    return {
      ref,
      flush,
      setMounted(value: boolean) {
        mounted = value;
      },
    };
  }).current;

  useIsoLayoutEffect(() => {
    registration.setMounted(true);
    return () => {
      registration.setMounted(false);
      registration.flush();
    };
  }, [registration]);

  // React attaches the refs of a component's elements before it runs that
  // component's layout effects, so a detach still pending here was not undone.
  useIsoLayoutEffect(() => {
    registration.flush();
  });

  return registration.ref;
}
