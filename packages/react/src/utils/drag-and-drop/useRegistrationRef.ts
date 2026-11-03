'use client';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { NOOP } from '@base-ui/utils/empty';
import type { DragCleanupFn } from './types';
import { useIsInDragPreview } from '../../draggable/positioner/DraggablePositionerContext';

const NOOP_REGISTRATION = () => NOOP;

/**
 * A stable ref callback that registers the attached element with the latest `register`,
 * and unregisters it on detach or replacement. A direct call with the attached node
 * re-registers it. A detach and re-attach of the same node within one commit, as when a
 * merged ref changes identity, keeps the registration. Re-registering mid-drag would make
 * a hovered target leave and re-enter, which loops if a handler sets state.
 * Inside a drag preview, which only pictures the dragged item, nothing registers.
 */
export function useRegistrationRef<TElement extends Element>(
  register: (element: TElement) => DragCleanupFn,
): (element: TElement | null) => void {
  const inPreview = useIsInDragPreview();
  const registerStable = useStableCallback(inPreview ? NOOP_REGISTRATION : register);
  const registration = useRefWithInit(() => {
    let current: { node: TElement; cleanup: DragCleanupFn } | null = null;
    // Set by a detach until the end of its commit, while React may re-attach the node.
    let pendingDetach = false;
    // Cleared by a second detach before the re-attach, such as a direct `ref(null)`.
    // The returning node then registers again.
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
