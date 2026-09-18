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

/** A participant under the pointer, with coordinates for application-defined placement. */
export interface DraggableCollision<TData = unknown> {
  /**
   * The participant under the pointer. Read `getLocalPoint()` or `getSnappedLocalPoint()`
   * to compute a destination. Coordinates are captured before drag callbacks can change layout.
   * Its payload is the draggable's static payload.
   */
  target: DropTargetRecord<TData>;
}

export interface DraggableCollisionEvent<TData = unknown> extends BaseDragEvent<TData> {
  /** The current destination, or null outside this group or over the source itself. */
  collision: DraggableCollision<TData> | null;
  /** The collision from the previous onCollisionChange callback, or null before the first one. */
  previousCollision: DraggableCollision<TData> | null;
}

export interface DraggableCollisionEndEvent<TData = unknown> extends MoveEndEvent<TData> {
  /** The final destination in this group, or null on cancellation or an unrelated drop. */
  collision: DraggableCollision<TData> | null;
  /** The collision from the previous onCollisionChange callback, or null before the first one. */
  previousCollision: DraggableCollision<TData> | null;
}

/**
 * Reports pointer coordinates within descendant draggables of the same kind.
 * Renders no element. Applications own their order, commit, and cancellation behavior.
 * Explicit targets can still represent empty containers and other destinations.
 *
 * Documentation: [Base UI Draggable](https://base-ui.com/react/utils/draggable#collision-provider)
 */
export function DraggableCollisionProvider<TData>(
  props: DraggableCollisionProviderProps<TData>,
): React.ReactNode {
  useDraggableContext();
  const parent = React.useContext(DraggableCollisionContext);
  const getProps = useStableCallback(() => props);
  // Ref counts also cover multiple source registrations composed on one element.
  const participants = useRefWithInit(() => new WeakMap<Element, number>()).current;
  const snapshots = useRefWithInit(
    () => new WeakMap<DropTargetRecord, DraggableCollision<TData>>(),
  ).current;
  const targetKind = useRefWithInit(() => createKind<TData>('collision-participant')).current;
  const involvedRef = React.useRef(false);
  const removedSource = React.useRef<DragSource | null>(null);
  const previous = React.useRef<DraggableCollision<TData> | null>(null);
  // The start of a drag this group did not own, replayed to `onMoveStart` if the
  // drag later reaches one of its participants, so the start/end pair always closes.
  const pendingStart = React.useRef<{
    event: BaseDragEvent<TData>;
    details: MoveStartEventDetails;
  } | null>(null);

  const register = useStableCallback(
    (
      element: HTMLElement,
      getParticipant: () => CollisionParticipant,
      sourceElement: HTMLElement,
    ) => {
      participants.set(sourceElement, (participants.get(sourceElement) ?? 0) + 1);
      const unregister = registerDropTarget<TData, TData>(element, () => {
        const participant = getParticipant();
        const config = getProps();
        return {
          [resolveCollision]: (
            record: DropTargetRecord<TData>,
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
          payload: participant.payload as TData,
          disabled: participant.disabled || participant.kind.id !== config.kind.id,
          canDrop: ({ source }) =>
            config.canCollide?.({ source, target: participant.payload as TData }) ?? true,
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
  ): DraggableCollision<TData> | null =>
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

  const update = (event: BaseDragEvent<TData>, details: DropTargetChangeEventDetails) => {
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
    onMoveStart(event: BaseDragEvent<TData>, details: MoveStartEventDetails) {
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
    onMoveEnd(event: MoveEndEvent<TData>, details: MoveEndEventDetails) {
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

export interface DraggableCollisionProviderProps<TData = unknown> {
  children?: React.ReactNode | undefined;
  /** The kind shared by this group's participants and incoming sources. */
  kind: DragKind<TData>;
  /** Excludes a destination, or rejects the entire target stack with 'reject'. */
  canCollide?:
    ((context: { source: DragSource<TData>; target: TData }) => boolean | 'reject') | undefined;
  /**
   * Called when a descendant participant starts moving, or when an external drag
   * first reaches this group. For an external drag, the event and location describe
   * the original pickup, not the later entry into this group.
   */
  onMoveStart?: ((event: BaseDragEvent<TData>, details: MoveStartEventDetails) => void) | undefined;
  /**
   * Called on each drag movement within a participant, and when the destination changes
   * or is left. Compare your computed position with the previous one to skip unchanged work.
   * A target change and movement sharing the same resolved record are reported once.
   */
  onCollisionChange?:
    | ((event: DraggableCollisionEvent<TData>, details: DropTargetChangeEventDetails) => void)
    | undefined;
  /** Called when a drag involving this group ends. Use the reason and final collision to commit. */
  onMoveEnd?:
    ((event: DraggableCollisionEndEvent<TData>, details: MoveEndEventDetails) => void) | undefined;
}

export namespace DraggableCollisionProvider {
  export type Props<TData = unknown> = DraggableCollisionProviderProps<TData>;
  export type Collision<TData = unknown> = DraggableCollision<TData>;
  export type CollisionEvent<TData = unknown> = DraggableCollisionEvent<TData>;
  export type MoveEndEvent<TData = unknown> = DraggableCollisionEndEvent<TData>;
}
