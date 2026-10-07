'use client';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import type { DragCleanupFn } from './types';

/**
 * A stable ref callback that registers the attached element with the latest `register`
 * and unregisters it on detach or replacement. It keeps its own cleanup, so a direct call
 * to re-register loses nothing. A same-node detach and re-attach within one commit, as when
 * a merged ref changes identity, keeps the registration: re-registering mid-drag would make
 * a hovered target leave and re-enter, looping forever if a handler sets state.
 */
export function useRegistrationRef<TElement extends Element>(
  register: (element: TElement) => DragCleanupFn,
): (element: TElement | null) => void {
  const registerStable = useStableCallback(register);
  const registration = useRefWithInit(() => {
    let current: { node: TElement; cleanup: DragCleanupFn } | null = null;
    // Set by a detach until the end of its commit, while React may re-attach the node.
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
        // detaches the refs below it, so `mounted` is already false here.
        if (!mounted || current === null) {
          teardown();
        } else if (pendingDetach) {
          reattachable = false;
        } else {
          pendingDetach = true;
          reattachable = true;
          // The layout effect below flushes it when this component rendered. A detach
          // from a descendant's own render runs no effect here, hence the microtask.
          queueMicrotask(flush);
        }
        return;
      }
      if (pendingDetach && reattachable && element === current?.node) {
        pendingDetach = false;
        return;
      }
      teardown();
      // `useStableCallback` publishes the closure during the commit, before refs
      // attach, so an abandoned or suspended render can't leak its parameters.
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
