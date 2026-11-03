'use client';
import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { warn } from '@base-ui/utils/warn';
import { refreshDragSource } from '../../utils/drag-and-drop/dragSource';
import { useRegisterSource } from '../../utils/drag-and-drop/useRegisterSource';
import { createRootDragStore } from '../../utils/drag-and-drop/synthetic/syntheticPreview';
import type { RootDrag } from '../../utils/drag-and-drop/synthetic/syntheticPreview';
import type {
  RegisterSourceParameters,
  RegisterTargetParameters,
} from '../../utils/drag-and-drop/registrationTypes';
import type {
  CollisionParticipant,
  DraggableCollisionContextValue,
} from '../collision-provider/DraggableCollisionContext';
import { dragSessionStore } from '../../utils/drag-and-drop/dragSessionStore';
import { useRegistrationRef } from '../../utils/drag-and-drop/useRegistrationRef';

// Module-scoped so `useStore` stays on its fast path.
function selectRootDrag(drag: RootDrag): RootDrag {
  return drag;
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
    snap?: RegisterTargetParameters<TPayload, unknown, TDragData>['snap'] | undefined;
    enabled: boolean;
    element?: ((element: HTMLElement) => HTMLElement) | undefined;
  },
): UseDraggableElementReturnValue {
  const registerSource = useRegisterSource();
  // Where this Root's drags publish their phase and preview. Registered with the element,
  // it also identifies this Root to its drag across a node swap.
  const dragStore = useRefWithInit(createRootDragStore).current;
  const elementRef = React.useRef<HTMLElement | null>(null);
  // Apply the committed parameters after every commit, as `manager.refresh` does
  // (see `refreshDragSource`). It only acts on real changes. Layout effects run after
  // every ref of the commit has attached, so a handle swapped in the same commit is in place.
  const refreshSource = useRefWithInit(() => () => {
    if (elementRef.current) {
      refreshDragSource(elementRef.current);
    }
  }).current;
  useIsoLayoutEffect(refreshSource);
  // Mounted handles in mount order. Only the first drives pickup. The rest are kept so
  // unmounting it falls back to another handle, not to the whole element.
  const attachedHandlesRef = React.useRef<HTMLElement[]>([]);
  // `null` when no `Draggable.Handle` is mounted, so the whole element is the handle.
  const getAttachedHandle = useRefWithInit(
    () => () => attachedHandlesRef.current[0] ?? null,
  ).current;

  // The accessor keeps one identity, since the engine compares parameters field by field.
  const internalParameters: RegisterSourceParameters<TPayload, TDragData> = {
    ...parameters,
    handle: getAttachedHandle,
  };
  const options = { parameters: internalParameters, collision: collisionOptions };
  const getOptions = useStableCallback(() => options);

  const registrationRef = useRegistrationRef<HTMLElement>((element) => {
    const unregisterSource = registerSource<TPayload, TDragData>(
      element,
      () => getOptions().parameters,
      dragStore,
    );
    const collisionConfig = getOptions().collision;
    if (!collisionConfig?.enabled) {
      return unregisterSource;
    }
    // Rebuilt only after a render, so the provider can reuse its registration for this
    // participant across frames (see `DraggableCollisionProvider`).
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
          payload: currentOptions.parameters.payload,
          // The cast holds because the provider disables participants of another kind.
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

  // Stable merged ref for `elementRef` and the engine registration. A node swapped in
  // mid-drag takes over the drag when it registers (see `retargetPreviewSource`).
  const ref = useRefWithInit(() => (node: HTMLElement | null) => {
    if (process.env.NODE_ENV !== 'production') {
      // A node swap detaches the old node first, so a second node arriving while
      // one is attached means two Triggers share this ref.
      if (node && elementRef.current && node !== elementRef.current) {
        warn(
          'A Draggable.Root contains more than one mounted Draggable.Trigger. ' +
            'Only the last one is registered, and unmounting either unregisters it, ' +
            'so the others are inert and look broken. ' +
            'Render a single Trigger per Root, wrapping each item in its own Draggable.Root.',
        );
      }
    }
    elementRef.current = node;
    registrationRef(node);
  }).current;

  // Set when a re-registration was skipped because this element was the active
  // source. It runs once `dragging` turns false.
  const pendingReconcileRef = React.useRef(false);

  // A collision provider change registers the source and its participant again.
  // Mid-gesture, that would restore `user-select` and `touch-action` and drop the
  // iOS touchmove guard, so it waits until the drag ends.
  const reconcile = useRefWithInit(() => () => {
    if (dragSessionStore.state?.source.element === elementRef.current) {
      pendingReconcileRef.current = true;
      return;
    }
    registrationRef(elementRef.current);
  }).current;

  // Refreshes the gesture setup itself, since a handle can attach or detach without
  // this component rendering.
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
    refreshSource();
    return () => {
      const index = handles.indexOf(node);
      if (index !== -1) {
        handles.splice(index, 1);
      }
      refreshSource();
    };
  }).current;

  const isFirstReconcile = React.useRef(true);
  useIsoLayoutEffect(() => {
    if (isFirstReconcile.current) {
      // The registration ref callback already registered on mount.
      isFirstReconcile.current = false;
      return;
    }
    reconcile();
    // `reconcile` is stable. `collision.element` is left out because it's often an
    // inline arrow, and re-registering on every render would reset the hovered target
    // mid-drag. It's read once, at registration.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collisionOptions?.context, collisionOptions?.enabled]);

  const drag = useStore(dragStore, selectRootDrag);
  const dragging = drag.phase === 'dragging';

  // Run a reconcile skipped mid-drag. `dragging` turning false re-renders this
  // hook, so the new collision provider takes over as soon as the drag ends.
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
    drag,
    registerHandle,
  };
}

export interface UseDraggableElementReturnValue {
  /** Ref callback to attach to the drag source element. Stable. */
  ref: React.RefCallback<HTMLElement>;
  /** This Root's drag: its phase and its preview. */
  drag: RootDrag;
  /**
   * Attaches a drag handle and returns the function that detaches it. Pickup is
   * restricted to the first attached handle. Without one, the whole source is
   * draggable. Stable.
   */
  registerHandle: (node: HTMLElement) => () => void;
}
