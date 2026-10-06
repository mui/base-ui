'use client';
import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { warn } from '@base-ui/utils/warn';
import {
  retargetDragSource,
  syncActiveDragSourcePayload,
} from '../../utils/drag-and-drop/dragSource';
import { useRegisterSource } from '../../utils/drag-and-drop/useRegisterSource';
import { createDragPreviewHandle } from '../preview/dragPreviewDeclaration';
import type { DragPreviewHandle } from '../preview/dragPreviewDeclaration';
import type {
  RegisterSourceParameters,
  RegisterTargetParameters,
} from '../../utils/drag-and-drop/registrationTypes';
import type {
  CollisionParticipant,
  DraggableCollisionContextValue,
} from '../collision-provider/DraggableCollisionContext';
import type { DraggableRootRecord } from './DraggableRoot';
import { dragSessionStore, dragSourceStore } from '../../utils/drag-and-drop/dragSessionStore';
import { useRegistrationRef } from '../../utils/drag-and-drop/useRegistrationRef';
import { settlingSourcesStore } from '../../utils/drag-and-drop/settlingSources';

// Reads the element from `ref` at selection time, so `dragging` follows the node
// behind the ref when a virtualizer swaps it. Declared at module scope so its
// identity is stable, which keeps `useStore` on its fast path.
type ElementRef = { readonly current: Element | null };
function selectIsDragging(source: DraggableRootRecord | null, r: ElementRef): boolean {
  return source?.element === r.current;
}

function selectIsSettling(sources: ReadonlySet<Element>, r: ElementRef): boolean {
  return r.current !== null && sources.has(r.current);
}

/**
 * Registers the element the returned `ref` is attached to as a drag source.
 * Backs `Draggable.Root`, which is the public API.
 * @internal
 */
export function useDraggableElement<TPayload = undefined, TDragData = unknown>(
  parameters: RegisterSourceParameters<TPayload, TDragData>,
  collisionOptions?: {
    context: DraggableCollisionContextValue;
    payload: unknown;
    snap?: RegisterTargetParameters<TPayload, unknown, TDragData>['snap'] | undefined;
    enabled: boolean;
    element?: ((element: HTMLElement) => HTMLElement) | undefined;
  },
): UseDraggableElementReturnValue<TPayload, TDragData> {
  const registerSource = useRegisterSource();
  const payloadOwner = useRefWithInit(() => ({})).current;
  // The `dragging` selector reads the live element behind this ref.
  const elementRef = React.useRef<HTMLElement | null>(null);
  useIsoLayoutEffect(() => {
    syncActiveDragSourcePayload(elementRef.current, parameters.kind.id, parameters.payload);
  });
  // Every mounted handle node in mount order. Only the first one drives pickup. The
  // rest are tracked so that unmounting the first falls back to another handle
  // instead of making the whole element draggable.
  const attachedHandlesRef = React.useRef<HTMLElement[]>([]);
  // `null` when no `Draggable.Handle` is mounted, so the whole element is the handle.
  const getAttachedHandle = useRefWithInit(
    () => () => attachedHandlesRef.current[0] ?? null,
  ).current;

  // The link a `Draggable.Preview` declares into. Created once, so carrying it on
  // context never re-registers anything.
  const previewHandle = useRefWithInit(createDragPreviewHandle<TPayload, TDragData>).current;

  // The engine compares these field by field before re-normalizing, so both
  // accessors keep one identity for the hook's lifetime.
  const internalParameters: RegisterSourceParameters<TPayload, TDragData> = {
    ...parameters,
    handle: getAttachedHandle,
    preview: previewHandle.preview,
  };
  const options = { parameters: internalParameters, collision: collisionOptions };
  const getOptions = useStableCallback(() => options);

  const registrationRef = useRegistrationRef<HTMLElement>((element) => {
    const unregisterSource = registerSource<TPayload, TDragData>(
      element,
      () => getOptions().parameters,
      payloadOwner,
    );
    const collisionConfig = getOptions().collision;
    if (!collisionConfig?.enabled) {
      return unregisterSource;
    }
    // Rebuilt only after a render. The provider reads this getter at least twice
    // per frame for each participant it walks, and the engine snapshots
    // registrations by identity.
    let lastCollisionOptions: typeof options | null = null;
    let participant: CollisionParticipant | null = null;
    const unregisterCollision = collisionConfig.context.register(
      collisionConfig.element?.(element) ?? element,
      () => {
        const currentOptions = getOptions();
        if (participant !== null && currentOptions === lastCollisionOptions) {
          return participant;
        }
        lastCollisionOptions = currentOptions;
        const collision = currentOptions.collision;
        participant = {
          kind: currentOptions.parameters.kind,
          payload: collision?.payload,
          // The provider accepts only this participant's source kind.
          snap: collision?.snap as CollisionParticipant['snap'],
          // A disabled source is still a destination. Only `collision={false}` opts out.
          disabled: !collision?.enabled,
        };
        return participant;
      },
      element,
    );
    return () => {
      try {
        unregisterCollision();
      } finally {
        unregisterSource();
      }
    };
  });

  // The last non-null node this ref held. React detaches the old node before
  // attaching the new one, so `elementRef.current` is already `null` when the new
  // node arrives and can't reveal an `a -> b` swap.
  const lastNodeRef = React.useRef<HTMLElement | null>(null);

  // Forward the attached node to both the engine registration and the local ref.
  // Stable, so this merged callback is created once.
  const ref = useRefWithInit(() => (node: HTMLElement | null) => {
    elementRef.current = node;
    if (node) {
      // A virtualizer can remount the item to a new node mid-drag. Point the
      // session at the new element so `dragging` stays true. `retargetDragSource`
      // does nothing unless `previous` is the active source.
      const previous = lastNodeRef.current;
      if (previous && previous !== node) {
        retargetDragSource(previous, node);
      }
      lastNodeRef.current = node;
    }
    registrationRef(node);
  }).current;

  // Set when a re-registration was skipped because this element was the active
  // source, after a handle swap or a reconcile input change. It runs once
  // `dragging` turns false, so the new handle still gets the static setup.
  const pendingReconcileRef = React.useRef(false);

  // Re-registration tears down and rebuilds the static setup. Mid-gesture, that
  // would restore `user-select` and `touch-action` and drop the iOS touchmove guard.
  // The `handle` getter already reads `attachedHandlesRef` on each call, so skip
  // the teardown mid-drag and re-register when the drag ends.
  const reconcile = useRefWithInit(() => () => {
    if (dragSessionStore.state?.source.element === elementRef.current) {
      pendingReconcileRef.current = true;
      return;
    }
    registrationRef(elementRef.current);
  }).current;

  // Re-register when a handle node attaches or detaches, so the static setup
  // follows it.
  const registerHandle = useRefWithInit(() => (node: HTMLElement) => {
    const handles = attachedHandlesRef.current;
    handles.push(node);
    if (process.env.NODE_ENV !== 'production') {
      if (handles.length > 1) {
        warn(
          'A Draggable.Root contains more than one mounted Draggable.Handle. ' +
            'Pickup is restricted to the first one, so the others are inert and look broken. ' +
            'Render a single handle, switching its content or position instead of mounting a second.',
        );
      }
    }
    reconcile();
    return () => {
      const index = handles.indexOf(node);
      if (index !== -1) {
        handles.splice(index, 1);
      }
      reconcile();
    };
  }).current;

  // Reconcile the static gesture setup when `disabled` changes without a node
  // swap. Skipped while this element is the active source.
  const reconcileKey = Boolean(parameters.disabled);
  const isFirstReconcile = React.useRef(true);
  useIsoLayoutEffect(() => {
    if (isFirstReconcile.current) {
      // The registration ref callback already applied the setup on mount.
      // Re-apply only on later changes.
      isFirstReconcile.current = false;
      return;
    }
    reconcile();
    // `reconcile` is stable, so only the keys below retrigger.
    // `collision.element` is left out because it is often an inline arrow.
    // Re-registering the source and its participant on every render would reset
    // the hovered target mid-drag. It is read once, at registration.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reconcileKey, collisionOptions?.context, collisionOptions?.enabled]);

  const dragging = useStore(dragSourceStore, selectIsDragging, elementRef);
  const settling = useStore(settlingSourcesStore, selectIsSettling, elementRef);

  // Run a reconcile skipped mid-drag. `dragging` turning false re-renders this
  // hook, so the swapped handle gets the static setup as soon as the drag ends.
  useIsoLayoutEffect(() => {
    if (!dragging && pendingReconcileRef.current) {
      pendingReconcileRef.current = false;
      registrationRef(elementRef.current);
    }
    // `registrationRef` and `elementRef` are stable, so only `dragging` retriggers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging]);

  return {
    ref,
    dragging,
    settling,
    registerHandle,
    previewHandle,
  };
}

export interface UseDraggableElementReturnValue<TPayload = undefined, TDragData = unknown> {
  /** Ref callback to attach to the drag source element. Stable. */
  ref: React.RefCallback<HTMLElement>;
  /** Whether this element is the one currently being dragged. */
  dragging: boolean;
  /** Whether this element's preview is settling into place after a drop. */
  settling: boolean;
  /**
   * Attach the child that is the drag handle, and return the function that detaches
   * it. Pickup is restricted to the handle. Without one, the whole source is
   * draggable. Stable.
   */
  registerHandle: (node: HTMLElement) => () => void;
  /** The link a `Draggable.Preview` declares into. Stable. */
  previewHandle: DragPreviewHandle<TPayload, TDragData>;
}
