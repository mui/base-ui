'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import type {
  BaseDragEvent,
  DragKind,
  DragInput,
  DragSource,
  DropTargetRecord,
  DropTargetChangeEventDetails,
  MoveEndEvent,
  MoveEndEventDetails,
  MoveStartEventDetails,
} from '../../types/drag';
import { registerDropTarget, registerMonitor } from '../../utils/drag-and-drop/registrations';
import { scheduleDropTargetParameterRefresh } from '../../utils/drag-and-drop/core/lifecycleManager';
import { dragSourceStore } from '../../utils/drag-and-drop/dragSessionStore';
import { resolveCollision } from '../../utils/drag-and-drop/collisionResolution';
import { createKind } from '../../utils/drag-and-drop/dragKind';
import { invalidateDirectionCache, isRtlCached } from '../../utils/drag-and-drop/collectionDrop';
import {
  DraggableCollisionContext,
  type CollisionParticipant,
  type CollisionPlacement,
} from './DraggableCollisionContext';
import { useDraggableContext } from '../DraggableContext';

/** A sortable destination resolved from the pointer within a participant. */
export interface DraggableCollision<TData = unknown> {
  /** The participant under the pointer. Its payload is the draggable's static payload. */
  target: DropTargetRecord<TData>;
  /** The insertion side, in reading order. */
  placement: 'before' | 'after';
}

export interface DraggableCollisionEvent<TData = unknown> extends BaseDragEvent<TData> {
  /** The current destination, or null outside this group or over the source itself. */
  collision: DraggableCollision<TData> | null;
}

export interface DraggableCollisionEndEvent<TData = unknown> extends MoveEndEvent<TData> {
  /** The final destination in this group, or null on cancellation or an unrelated drop. */
  collision: DraggableCollision<TData> | null;
}

/**
 * Coordinates pointer-based insertion among descendant draggables of the same kind.
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
  const lastInput = React.useRef<DragInput | null>(null);
  // Each participant's marker setter; the destination's React state drives
  // `data-collision-before` / `data-collision-after` on its root.
  const markers = useRefWithInit(
    () => new WeakMap<Element, (placement: CollisionPlacement | null) => void>(),
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
      onCollision: (placement: CollisionPlacement | null) => void,
    ) => {
      participants.set(sourceElement, (participants.get(sourceElement) ?? 0) + 1);
      markers.set(element, onCollision);
      const unregister = registerDropTarget<TData, TData>(element, () => {
        const participant = getParticipant();
        const config = getProps();
        return {
          [resolveCollision]: (
            record: DropTargetRecord<TData>,
            context: { input: DragInput; source: DragSource },
          ) => {
            if (sourceElement === context.source.element || snapshots.has(record)) {
              return;
            }
            const horizontal = config.orientation === 'horizontal';
            const input = context.input;
            const last = lastInput.current ?? input;
            const delta = horizontal ? input.clientX - last.clientX : input.clientY - last.clientY;
            let placement: 'before' | 'after';
            if (
              config.placement === 'direction' &&
              delta === 0 &&
              previous.current?.target.element === element
            ) {
              // Stationary over the same item: keep the side the travel chose.
              placement = previous.current.placement;
            } else {
              // No travel to read but a new item under the pointer — auto-scroll or
              // a re-resolve moved it there — falls back to the midpoint rule
              // rather than reporting no destination.
              const point =
                config.placement === 'direction' && delta !== 0 ? null : record.getLocalPoint();
              let after = point ? (horizontal ? point.x : point.y) > 0.5 : delta > 0;
              if (horizontal && isRtlCached(element)) {
                after = !after;
              }
              placement = after ? 'after' : 'before';
            }
            snapshots.set(record, { target: record, placement });
          },
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
        if (markers.get(element) === onCollision) {
          markers.delete(element);
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

  const clearMarker = (collision: DraggableCollision<TData> | null) => {
    if (collision) {
      markers.get(collision.target.element)?.(null);
    }
  };

  const update = (event: BaseDragEvent<TData>, details: DropTargetChangeEventDetails) => {
    const collision = resolve(event.location.current.dropTargets[0]);
    if (collision) {
      markInvolved();
    }
    lastInput.current = event.location.current.input;
    const last = previous.current;
    const changed =
      collision?.target.element !== last?.target.element ||
      !Object.is(
        collision &&
          (props.getItemId ? props.getItemId(collision.target.payload) : collision.target.payload),
        last && (props.getItemId ? props.getItemId(last.target.payload) : last.target.payload),
      ) ||
      collision?.placement !== last?.placement;
    previous.current = collision;
    if (changed) {
      if (last?.target.element !== collision?.target.element) {
        clearMarker(last);
      }
      if (collision) {
        markers.get(collision.target.element)?.(collision.placement);
      }
      props.onCollisionChange?.({ ...event, collision }, details);
    }
  };

  const getMonitor = useStableCallback(() => ({
    accept: props.kind,
    onMoveStart(event: BaseDragEvent<TData>, details: MoveStartEventDetails) {
      previous.current = null;
      lastInput.current = event.location.current.input;
      // Row direction is read once per drag (see `collectionDrop`).
      invalidateDirectionCache();
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
      clearMarker(previous.current);
      if (collision) {
        markInvolved();
      }
      const involved = involvedRef.current;
      involvedRef.current = false;
      pendingStart.current = null;
      previous.current = null;
      if (involved) {
        props.onMoveEnd?.({ ...event, collision }, details);
      }
    },
  }));
  useIsoLayoutEffect(() => {
    const unregister = registerMonitor(getMonitor);
    return () => {
      unregister();
      const last = previous.current;
      previous.current = null;
      if (last) {
        markers.get(last.target.element)?.(null);
      }
    };
  }, [getMonitor, markers]);

  const firstParameterEffect = React.useRef(true);
  useIsoLayoutEffect(() => {
    if (firstParameterEffect.current) {
      firstParameterEffect.current = false;
    } else if (dragSourceStore.state && props.kind.matches(dragSourceStore.state)) {
      scheduleDropTargetParameterRefresh();
    }
  }, [props.kind, props.canCollide, props.orientation, props.placement]);

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
  /** Returns a stable identity when participant payloads are recreated, such as inline objects. */
  getItemId?: ((payload: TData) => string | number) | undefined;
  /** The list's reading axis. @default 'vertical' */
  orientation?: 'vertical' | 'horizontal' | undefined;
  /** Resolve insertion by the item midpoint or pointer travel direction. @default 'midpoint' */
  placement?: 'midpoint' | 'direction' | undefined;
  /** Excludes a destination, or rejects the entire target stack with 'reject'. */
  canCollide?:
    ((context: { source: DragSource<TData>; target: TData }) => boolean | 'reject') | undefined;
  /** Called when a descendant participant starts moving. */
  onMoveStart?: ((event: BaseDragEvent<TData>, details: MoveStartEventDetails) => void) | undefined;
  /** Called when the destination or insertion side changes, including leaving the group. */
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
