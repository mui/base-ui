'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import type {
  BaseDragEvent,
  DragKind,
  DragSource,
  DropTargetRecord,
  DropTargetChangeEventDetails,
  MoveEndEvent,
  MoveEndEventDetails,
  MoveStartEventDetails,
} from '../../types/drag';
import { registerDropTarget, registerMonitor } from '../../utils/drag-and-drop/registrations';
import { scheduleDropTargetParameterRefresh } from '../../utils/drag-and-drop/core/lifecycleManager';
import { dragSessionStore, dragSourceStore } from '../../utils/drag-and-drop/dragSessionStore';
import { resolveCollision } from '../../utils/drag-and-drop/collisionResolution';
import { createKind } from '../../utils/drag-and-drop/dragKind';
import { DraggableCollisionContext, type CollisionParticipant } from './DraggableCollisionContext';
import { useDraggableContext } from '../DraggableContext';

/** The item under the pointer during a drag. */
export interface DraggableCollision<TPayload = unknown> {
  /**
   * The item under the pointer. Use `payload` to identify it and `getLocalPoint()`
   * or `getSnappedLocalPoint()` to choose an insertion position.
   */
  target: DropTargetRecord<TPayload>;
}

export interface DraggableCollisionEvent<TPayload = unknown> extends BaseDragEvent<TPayload> {
  /** The item under the pointer, or `null` outside this group or over the dragged item. */
  collision: DraggableCollision<TPayload> | null;
  /** The last collision reported by `onCollisionChange`, or `null` before the first call. */
  previousCollision: DraggableCollision<TPayload> | null;
}

export interface DraggableCollisionEndEvent<TPayload = unknown> extends MoveEndEvent<TPayload> {
  /**
   * The item under the pointer at drop, or `null` on cancellation, outside this group,
   * or over the dragged item.
   */
  collision: DraggableCollision<TPayload> | null;
  /** The last collision reported by `onCollisionChange`, or `null` before the first call. */
  previousCollision: DraggableCollision<TPayload> | null;
}

/**
 * Groups draggables of the same kind and reports the item under the pointer.
 * Use its callbacks to choose an insertion position and update the item order.
 * Doesn't render an HTML element.
 *
 * Documentation: [Base UI Draggable](https://base-ui.com/react/utils/draggable#collision-provider)
 */
export function DraggableCollisionProvider<TPayload>(
  props: DraggableCollisionProviderProps<TPayload>,
): React.ReactNode {
  useDraggableContext();
  const parent = React.useContext(DraggableCollisionContext);
  const getProps = useStableCallback(() => props);
  // Ref counts also cover multiple source registrations composed on one element.
  const participants = useRefWithInit(() => new WeakMap<Element, number>()).current;
  const snapshots = useRefWithInit(
    () => new WeakMap<DropTargetRecord, DraggableCollision<TPayload>>(),
  ).current;
  const targetKind = useRefWithInit(() => createKind<TPayload>('collision-participant')).current;
  const involvedRef = React.useRef(false);
  const removedSource = React.useRef<DragSource | null>(null);
  const previous = React.useRef<DraggableCollision<TPayload> | null>(null);
  // The start of a drag this group did not own, replayed to `onMoveStart` if the
  // drag later reaches one of its participants, so the start/end pair always closes.
  const pendingStart = React.useRef<{
    event: BaseDragEvent<TPayload>;
    details: MoveStartEventDetails;
  } | null>(null);

  const register = useStableCallback(
    (
      element: HTMLElement,
      getParticipant: () => CollisionParticipant,
      sourceElement: HTMLElement,
    ) => {
      participants.set(sourceElement, (participants.get(sourceElement) ?? 0) + 1);
      const unregister = registerDropTarget<TPayload, TPayload>(element, () => {
        const participant = getParticipant();
        const config = getProps();
        return {
          [resolveCollision]: (
            record: DropTargetRecord<TPayload>,
            context: { source: DragSource },
          ) => {
            if (sourceElement === context.source.element || snapshots.has(record)) {
              return;
            }
            // Freeze both the geometry and dynamic snap steps before source or target
            // callbacks can reorder items. The readers memoize these values per record.
            record.getLocalPoint();
            record.getSnappedLocalPoint();
            snapshots.set(record, { target: record });
          },
          snap: participant.snap,
          kind: targetKind,
          accept: config.kind,
          payload: participant.payload as TPayload,
          disabled: participant.disabled || participant.kind.id !== config.kind.id,
          canDrop: ({ source }) =>
            config.canCollide?.({ source, target: participant.payload as TPayload }) ?? true,
        };
      });
      return () => {
        // A source callback can unmount its row before the start monitor runs.
        if (dragSourceStore.state?.element === sourceElement) {
          removedSource.current = dragSourceStore.state;
        }
        const count = participants.get(sourceElement) ?? 0;
        if (count <= 1) {
          participants.delete(sourceElement);
        } else {
          participants.set(sourceElement, count - 1);
        }
        unregister();
      };
    },
  );

  // `targetKind` is unique to this provider, so a matching record is one of its
  // participants; the source's own participant never captures a snapshot.
  const resolve = (
    target: DropTargetRecord | null | undefined,
  ): DraggableCollision<TPayload> | null =>
    target && targetKind.matches(target) ? (snapshots.get(target) ?? null) : null;

  const markInvolved = () => {
    if (involvedRef.current) {
      return;
    }
    involvedRef.current = true;
    const start = pendingStart.current;
    pendingStart.current = null;
    if (start) {
      props.onMoveStart?.(start.event, start.details);
    }
  };

  const update = (event: BaseDragEvent<TPayload>, details: DropTargetChangeEventDetails) => {
    const collision = resolve(event.location.current.dropTargets[0]);
    if (collision) {
      markInvolved();
      // The replayed start callback can cancel this drag synchronously.
      if (dragSessionStore.state?.source !== event.source) {
        return;
      }
    }
    const previousCollision = previous.current;
    // Target changes and movement can dispatch the same resolved record. Deliver
    // it once, but report every new sample within a participant and the first leave.
    if (collision === previousCollision) {
      return;
    }
    previous.current = collision;
    props.onCollisionChange?.({ ...event, collision, previousCollision }, details);
  };

  const getMonitor = useStableCallback(() => ({
    accept: props.kind,
    onMoveStart(event: BaseDragEvent<TPayload>, details: MoveStartEventDetails) {
      previous.current = null;
      involvedRef.current =
        participants.has(event.source.element) || removedSource.current === event.source;
      removedSource.current = null;
      pendingStart.current = null;
      if (involvedRef.current) {
        props.onMoveStart?.(event, details);
      } else {
        pendingStart.current = { event, details };
      }
    },
    onMove: update,
    onTargetChange: update,
    onMoveEnd(event: MoveEndEvent<TPayload>, details: MoveEndEventDetails) {
      const collision = resolve(event.dropTarget);
      const previousCollision = previous.current;
      if (collision) {
        markInvolved();
      }
      const involved = involvedRef.current;
      involvedRef.current = false;
      pendingStart.current = null;
      previous.current = null;
      if (involved) {
        props.onMoveEnd?.({ ...event, collision, previousCollision }, details);
      }
    },
  }));
  useIsoLayoutEffect(() => registerMonitor(getMonitor), [getMonitor]);

  const firstParameterEffect = React.useRef(true);
  useIsoLayoutEffect(() => {
    if (firstParameterEffect.current) {
      firstParameterEffect.current = false;
    } else if (dragSourceStore.state && props.kind.matches(dragSourceStore.state)) {
      scheduleDropTargetParameterRefresh();
    }
  }, [props.kind, props.canCollide]);

  const context = React.useMemo(
    () => ({ register, kind: props.kind, parent }),
    [register, props.kind, parent],
  );
  return (
    <DraggableCollisionContext.Provider value={context}>
      {props.children}
    </DraggableCollisionContext.Provider>
  );
}

export interface DraggableCollisionProviderProps<TPayload = unknown> {
  children?: React.ReactNode | undefined;
  /** The kind of draggable items in this group. Pass the same kind to each `Draggable.Root`. */
  kind: DragKind<TPayload>;
  /**
   * Whether the dragged item can be dropped on an item in this group.
   * Return `false` to skip the item, or `'reject'` to reject the drop entirely.
   */
  canCollide?:
    | ((context: { source: DragSource<TPayload>; target: TPayload }) => boolean | 'reject')
    | undefined;
  /**
   * Called when an item in this group starts dragging, or a dragged item first enters the group.
   * The event describes the start of the drag, including when it started outside the group.
   */
  onMoveStart?:
    ((event: BaseDragEvent<TPayload>, details: MoveStartEventDetails) => void) | undefined;
  /**
   * Called as the pointer moves over items or leaves them.
   * Compare the position computed from `collision` and `previousCollision` to skip unchanged updates.
   */
  onCollisionChange?:
    | ((event: DraggableCollisionEvent<TPayload>, details: DropTargetChangeEventDetails) => void)
    | undefined;
  /**
   * Called when a drag that started in or entered this group ends.
   * Use `collision` to apply the final position, or `canceled` to restore the original order.
   */
  onMoveEnd?:
    | ((event: DraggableCollisionEndEvent<TPayload>, details: MoveEndEventDetails) => void)
    | undefined;
}

export namespace DraggableCollisionProvider {
  export type Props<TPayload = unknown> = DraggableCollisionProviderProps<TPayload>;
  export type Collision<TPayload = unknown> = DraggableCollision<TPayload>;
  export type CollisionEvent<TPayload = unknown> = DraggableCollisionEvent<TPayload>;
  export type MoveEndEvent<TPayload = unknown> = DraggableCollisionEndEvent<TPayload>;
}
