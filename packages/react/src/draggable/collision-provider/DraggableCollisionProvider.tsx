'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import type {
  MoveStartEvent,
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
import type { RegisterDropTargetParameters } from '../../utils/drag-and-drop/dropTarget';
import { scheduleDropTargetParameterRefresh } from '../../utils/drag-and-drop/core/lifecycleManager';
import { dragSessionStore, dragSourceStore } from '../../utils/drag-and-drop/dragSessionStore';
import {
  resolveCollision,
  type CollisionResolutionRegistration,
} from '../../utils/drag-and-drop/collisionResolution';
import { createKind } from '../../utils/drag-and-drop/dragKind';
import { DraggableCollisionContext, type CollisionParticipant } from './DraggableCollisionContext';
import { useDraggableContext } from '../DraggableContext';

/** The item of the group under the pointer. */
export interface DraggableCollision<TPayload = unknown, TDragData = unknown> {
  /**
   * The item under the pointer. Use `payload` to identify it, and `getLocalPoint()`
   * or `getSnappedLocalPoint()` to decide on which side of it to insert.
   */
  target: DropTargetRecord<TPayload, TDragData>;
}

export interface DraggableCollisionEvent<
  TPayload = unknown,
  TDragData = unknown,
> extends BaseDragEvent<TPayload, TDragData> {
  /** The item under the pointer, or `null` when outside the group or over the dragged item. */
  collision: DraggableCollision<TPayload, TDragData> | null;
  /** The collision reported by the previous `onCollisionChange` call, or `null` before the first. */
  previousCollision: DraggableCollision<TPayload, TDragData> | null;
}

export interface DraggableCollisionEndEvent<
  TPayload = unknown,
  TDragData = unknown,
> extends MoveEndEvent<TPayload, TDragData> {
  /**
   * The item under the pointer at release, or `null` when the drag was canceled,
   * released outside the group, or released over the dragged item.
   */
  collision: DraggableCollision<TPayload, TDragData> | null;
  /** The collision reported by the previous `onCollisionChange` call, or `null` before the first. */
  previousCollision: DraggableCollision<TPayload, TDragData> | null;
}

/**
 * Groups draggables of the same kind and reports which one is under the pointer, for sorting.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Draggable](https://base-ui.com/react/utils/draggable#collisionprovider)
 */
export function DraggableCollisionProvider<TPayload, TDragData = unknown>(
  props: DraggableCollisionProviderProps<TPayload, TDragData>,
): React.ReactNode {
  useDraggableContext();
  const parent = React.useContext(DraggableCollisionContext);
  const getProps = useStableCallback(() => props);
  // Ref counts also cover multiple source registrations composed on one element.
  const participants = useRefWithInit(() => new WeakMap<Element, number>()).current;
  // The registered target elements, so a `canCollide` change refreshes only this
  // group's records instead of every drop target on the page.
  const participantElements = useRefWithInit(() => new Set<HTMLElement>()).current;
  const snapshots = useRefWithInit(
    () => new WeakMap<DropTargetRecord, DraggableCollision<TPayload, TDragData>>(),
  ).current;
  const targetKind = useRefWithInit(() =>
    createKind<TPayload, TDragData>('collision-participant'),
  ).current;
  const involvedRef = React.useRef(false);
  const removedSource = React.useRef<DragSource | null>(null);
  const previous = React.useRef<DraggableCollision<TPayload, TDragData> | null>(null);
  // The start of a drag this group did not own, replayed to `onMoveStart` if the
  // drag later reaches one of its participants, so the start/end pair always closes.
  const pendingStart = React.useRef<{
    event: BaseDragEvent<TPayload, TDragData>;
    details: MoveStartEventDetails;
  } | null>(null);

  const register = useStableCallback(
    (
      element: HTMLElement,
      getParticipant: () => CollisionParticipant,
      sourceElement: HTMLElement,
    ) => {
      participants.set(sourceElement, (participants.get(sourceElement) ?? 0) + 1);
      participantElements.add(element);
      // Rebuilt only when the participant or this provider's props change: the
      // engine reads the getter at least twice per frame per walked target and
      // snapshots registrations by identity, so a fresh object per call would
      // be copied every frame.
      let lastParticipant: CollisionParticipant | null = null;
      let lastConfig: DraggableCollisionProviderProps<TPayload, TDragData> | null = null;
      let registration:
        | (RegisterDropTargetParameters<TPayload, TPayload, TDragData, TDragData> &
            CollisionResolutionRegistration<TPayload, TDragData>)
        | null = null;
      const unregister = registerDropTarget<TPayload, TPayload, TDragData, TDragData>(
        element,
        () => {
          const participant = getParticipant();
          const config = getProps();
          if (registration !== null && participant === lastParticipant && config === lastConfig) {
            return registration;
          }
          lastParticipant = participant;
          lastConfig = config;
          registration = {
            [resolveCollision]: (
              record: DropTargetRecord<TPayload, TDragData>,
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
          return registration;
        },
      );
      return () => {
        // A source callback can unmount its row before the start monitor runs.
        // Read from the session store: its `source` keeps the identity every event
        // of the drag reports, while `dragSourceStore` publishes copies for
        // reactive subscribers.
        const activeSource = dragSessionStore.state?.source ?? null;
        if (activeSource?.element === sourceElement) {
          removedSource.current = activeSource;
        }
        const count = participants.get(sourceElement) ?? 0;
        if (count <= 1) {
          participants.delete(sourceElement);
        } else {
          participants.set(sourceElement, count - 1);
        }
        participantElements.delete(element);
        unregister();
      };
    },
  );

  // `targetKind` is unique to this provider, so a matching record is one of its
  // participants; the source's own participant never captures a snapshot.
  const resolve = (
    target: DropTargetRecord | null | undefined,
  ): DraggableCollision<TPayload, TDragData> | null =>
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

  const update = (
    event: BaseDragEvent<TPayload, TDragData>,
    details: DropTargetChangeEventDetails,
  ) => {
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
    onMoveStart(event: BaseDragEvent<TPayload, TDragData>, details: MoveStartEventDetails) {
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
    onMoveEnd(event: MoveEndEvent<TPayload, TDragData>, details: MoveEndEventDetails) {
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
      // Scoped per participant: an inline `canCollide` gets a new identity on every
      // render, and a page-wide refresh here would re-resolve every target per frame.
      for (const element of participantElements) {
        scheduleDropTargetParameterRefresh(element);
      }
    }
  }, [props.kind, props.canCollide, participantElements]);

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

export interface DraggableCollisionProviderProps<TPayload = unknown, TDragData = unknown> {
  children?: React.ReactNode | undefined;
  /** The kind of the items in this group. Pass the same kind to each `<Draggable.Root>`. */
  kind: DragKind<TPayload, TDragData>;
  /**
   * Whether the dragged item can be dropped on a given item of this group.
   * Return `false` to skip the item, or `'reject'` to block the drop.
   */
  canCollide?:
    | ((context: {
        source: DragSource<TPayload, TDragData>;
        target: TPayload;
      }) => boolean | 'reject')
    | undefined;
  /**
   * Event handler called when an item of this group starts dragging, or when a drag
   * that started elsewhere first enters the group.
   */
  onMoveStart?:
    | ((event: BaseDragEvent<TPayload, TDragData>, details: MoveStartEventDetails) => void)
    | undefined;
  /**
   * Event handler called when the item under the pointer changes, including when
   * the pointer leaves the group. Compare `collision` with `previousCollision` to
   * skip updates when the insertion position hasn't changed.
   */
  onCollisionChange?:
    | ((
        event: DraggableCollisionEvent<TPayload, TDragData>,
        details: DropTargetChangeEventDetails,
      ) => void)
    | undefined;
  /**
   * Event handler called when a drag that involved this group ends.
   * Use `collision` to apply the final position, or `canceled` to restore the original order.
   */
  onMoveEnd?:
    | ((
        event: DraggableCollisionEndEvent<TPayload, TDragData>,
        details: MoveEndEventDetails,
      ) => void)
    | undefined;
}

export type DraggableCollisionProviderMoveStartEvent<
  TPayload = unknown,
  TDragData = unknown,
> = MoveStartEvent<TPayload, TDragData>;
export type DraggableCollisionProviderMoveStartEventDetails = MoveStartEventDetails;
export type DraggableCollisionProviderMoveStartEventReason =
  DraggableCollisionProviderMoveStartEventDetails['reason'];
export type DraggableCollisionProviderCollisionChangeEvent<
  TPayload = unknown,
  TDragData = unknown,
> = DraggableCollisionEvent<TPayload, TDragData>;
export type DraggableCollisionProviderCollisionChangeEventDetails = DropTargetChangeEventDetails;
export type DraggableCollisionProviderCollisionChangeEventReason =
  DraggableCollisionProviderCollisionChangeEventDetails['reason'];
export type DraggableCollisionProviderMoveEndEventDetails = MoveEndEventDetails;
export type DraggableCollisionProviderMoveEndEventReason =
  DraggableCollisionProviderMoveEndEventDetails['reason'];

export namespace DraggableCollisionProvider {
  export type MoveStartEvent<
    TPayload = unknown,
    TDragData = unknown,
  > = DraggableCollisionProviderMoveStartEvent<TPayload, TDragData>;
  export type MoveStartEventDetails = DraggableCollisionProviderMoveStartEventDetails;
  export type MoveStartEventReason = DraggableCollisionProviderMoveStartEventReason;
  export type CollisionChangeEvent<
    TPayload = unknown,
    TDragData = unknown,
  > = DraggableCollisionProviderCollisionChangeEvent<TPayload, TDragData>;
  export type CollisionChangeEventDetails = DraggableCollisionProviderCollisionChangeEventDetails;
  export type CollisionChangeEventReason = DraggableCollisionProviderCollisionChangeEventReason;
  export type MoveEndEventDetails = DraggableCollisionProviderMoveEndEventDetails;
  export type MoveEndEventReason = DraggableCollisionProviderMoveEndEventReason;
  export type Props<TPayload = unknown, TDragData = unknown> = DraggableCollisionProviderProps<
    TPayload,
    TDragData
  >;
  export type Collision<TPayload = unknown, TDragData = unknown> = DraggableCollision<
    TPayload,
    TDragData
  >;
  export type CollisionEvent<TPayload = unknown, TDragData = unknown> = DraggableCollisionEvent<
    TPayload,
    TDragData
  >;
  export type MoveEndEvent<TPayload = unknown, TDragData = unknown> = DraggableCollisionEndEvent<
    TPayload,
    TDragData
  >;
}
