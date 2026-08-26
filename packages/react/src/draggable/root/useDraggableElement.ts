'use client';
import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { warn } from '@base-ui/utils/warn';
import { useRegisterDraggable } from '../../utils/drag-and-drop/useInnerDragEngine';
import {
  createDragPreviewHandle,
  type DragPreviewHandle,
} from '../../utils/drag-and-drop/dragPreviewDeclaration';
import type {
  InternalDraggableParameters,
  RegisterDraggableParameters,
} from '../../types/dragRegistration';
import type { DragSource } from '../../types/drag';
import {
  dragSessionStore,
  dragSourceStore,
  isDraggingElement,
  retargetDragSource,
} from '../../utils/drag-and-drop/dragSessionStore';
import { useRegistrationRef } from '../../utils/drag-and-drop/useRegistrationRef';

// Read the element from `ref` at selection time so `dragging` keeps tracking
// the node behind the ref even when a virtualizer swaps it. Module-scope
// (stable-identity) selector so `useStore`'s selector-identity fast path holds.
type ElementRef = { readonly current: Element | null };
function selectIsDragging(source: DragSource | null, r: ElementRef): boolean {
  return source?.element === r.current;
}

/**
 * Registers the element the returned `ref` is attached to as a drag source.
 * Backs `Draggable.Root`, which is the public API.
 * @internal
 */
export function useDraggableElement<TData = undefined>(
  parameters: RegisterDraggableParameters<TData>,
): UseDraggableElementReturnValue<TData> {
  const registerDraggable = useRegisterDraggable();
  const getParameters = useStableCallback(() => parameters);

  // The `dragging` selector reads the live element behind this ref.
  const elementRef = React.useRef<HTMLElement | null>(null);
  // Every mounted handle, in mount order, tagged with the token its
  // `Draggable.Handle` identifies itself by. Only the first drives pickup; the
  // rest are tracked so unmounting one falls back to a survivor instead of to
  // "no handle", which would silently make the whole element draggable.
  const attachedHandlesRef = React.useRef<Array<{ token: object; node: HTMLElement }>>([]);

  // The link a `Draggable.Preview` declares into. Created once, so carrying it on
  // context never re-registers anything.
  const previewHandle = useRefWithInit(createDragPreviewHandle<TData>).current;

  const registrationRef = useRegistrationRef<HTMLElement>((element) => {
    // These accessors only read stable refs, so keep one function per
    // registration instead of rebuilding both on every engine dispatch.
    const getAttachedHandle = () => attachedHandlesRef.current[0]?.node ?? null;
    const getDragPreviewDeclaration = () => previewHandle.getDeclaration();
    let lastParams: RegisterDraggableParameters<TData> | null = null;
    let normalized: InternalDraggableParameters<TData> | null = null;

    return registerDraggable<TData>(
      element,
      () => {
        const params = getParameters();
        if (params === lastParams && normalized !== null) {
          return normalized;
        }
        // An imperative `dragHandle` wins; otherwise fall back to the element
        // behind `Draggable.Handle` (`null` there means the whole element is the handle).
        lastParams = params;
        normalized = {
          ...params,
          dragHandle: params.dragHandle ?? getAttachedHandle,
          getDragPreviewDeclaration,
        };
        return normalized;
      },
      // React replaces `params` each render, so identity is a sound revision key.
      // Imperative registrations intentionally leave this off: their getter may
      // mutate and return one stable object while behavior changes per event.
      true,
    );
  });

  // The last non-null node this ref held. React detaches the old node before
  // attaching its replacement, so `elementRef.current` is already `null` by the time
  // the new node arrives — comparing against it would never observe a direct
  // `a -> b` swap.
  const lastNodeRef = React.useRef<HTMLElement | null>(null);

  // Forward the attached node to both the engine registration and the local ref.
  // Stable, so this merged callback is created once.
  const ref = useRefWithInit(() => (node: HTMLElement | null) => {
    elementRef.current = node;
    if (node) {
      // A virtualizer can remount the item to a fresh node mid-drag. When this
      // draggable was the active source, re-point the session at the new element
      // so `dragging` keeps tracking it (it went stale, then false, otherwise).
      // `retargetDragSource` already guards against cross-drag misfires.
      const previous = lastNodeRef.current;
      if (previous && previous !== node) {
        retargetDragSource(previous, node);
      }
      lastNodeRef.current = node;
    }
    registrationRef(node);
  }).current;

  // A re-registration that was skipped mid-drag (handle swap or reconcile-input
  // change while this element was the active source); flushed once `dragging`
  // flips back to false so the swapped-in handle still receives the static setup.
  const pendingReconcileRef = React.useRef(false);

  // Re-run the draggable registration when the handle node attaches or detaches so
  // the static setup follows it.
  const updateHandleElement = (
    handles: Array<{ token: object; node: HTMLElement }>,
    node: HTMLElement | null,
    token: object,
  ) => {
    const index = handles.findIndex((handle) => handle.token === token);
    if (node) {
      if (index === -1) {
        handles.push({ token, node });
      } else {
        // Same handle, new node (a virtualizer recycling the row).
        handles[index].node = node;
      }
      if (process.env.NODE_ENV !== 'production') {
        if (handles.length > 1) {
          warn(
            'Base UI: a Draggable.Root contains more than one mounted Draggable.Handle. ' +
              'Pickup is restricted to the first one, so the others are inert and look broken. ' +
              'Render a single handle, switching its content or position instead of mounting a second.',
          );
        }
      }
    } else if (index !== -1) {
      handles.splice(index, 1);
    }
    // Re-registration tears the static setup down and rebuilds it, which mid-gesture
    // would restore `user-select`/`touch-action` and drop the iOS touchmove guard.
    // The live `dragHandle` closure already reads `attachedHandlesRef` fresh, so skip
    // the teardown mid-drag and flush the re-registration when the drag ends.
    if (isDraggingElement(dragSessionStore.state, elementRef.current)) {
      pendingReconcileRef.current = true;
      return;
    }
    registrationRef(elementRef.current);
  };

  const setHandleElement = useRefWithInit(() => (node: HTMLElement | null, token: object) => {
    updateHandleElement(attachedHandlesRef.current, node, token);
  }).current;

  // Reconcile the static gesture setup when `disabled` changes without a node
  // swap. Skipped while this element is the active source.
  const reconcileKey = Boolean(parameters.disabled);
  const isFirstReconcile = React.useRef(true);
  useIsoLayoutEffect(() => {
    if (isFirstReconcile.current) {
      // The registration ref callback already applied the setup with these
      // inputs on mount; only re-apply on a *subsequent* change.
      isFirstReconcile.current = false;
      return;
    }
    const element = elementRef.current;
    if (!element) {
      return;
    }
    if (isDraggingElement(dragSessionStore.state, element)) {
      pendingReconcileRef.current = true;
      return;
    }
    registrationRef(element);
    // `registrationRef` and `elementRef` are stable; only `reconcileKey` should retrigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reconcileKey]);

  const dragging = useStore(dragSourceStore, selectIsDragging, elementRef);

  // Flush a reconcile skipped mid-drag: `dragging` flipping false re-renders this
  // hook, so the swapped handle (or changed a11y inputs) receives the static
  // setup as soon as the drag ends.
  useIsoLayoutEffect(() => {
    if (!dragging && pendingReconcileRef.current) {
      pendingReconcileRef.current = false;
      registrationRef(elementRef.current);
    }
    // `registrationRef` and `elementRef` are stable; only `dragging` should retrigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging]);

  return {
    ref,
    dragging,
    setHandleElement,
    previewHandle,
  };
}

export interface UseDraggableElementReturnValue<TData = undefined> {
  /** Ref callback to attach to the drag source element. Stable. */
  ref: React.RefCallback<HTMLElement>;
  /** Whether this element is the one currently being dragged. */
  dragging: boolean;
  /**
   * Attach or detach the child that should be the drag handle — pickup is then
   * restricted to it. Never called means the whole source is draggable. `token`
   * identifies the calling handle across attach and detach. Stable.
   */
  setHandleElement: (node: HTMLElement | null, token: object) => void;
  /** The link a `Draggable.Preview` declares into. Stable. */
  previewHandle: DragPreviewHandle<TData>;
}
