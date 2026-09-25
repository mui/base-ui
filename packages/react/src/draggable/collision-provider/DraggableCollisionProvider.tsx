'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import type { BaseUIGenericEventDetails } from '../../internals/createBaseUIEventDetails';
import type {
  DragEndReason,
  DragEventDetailsProperties,
  DragKind,
  DragSource,
  DragSourceEventValue,
  DraggableTargetRecord,
  DropTargetChangeReason,
  MoveStartEventDetails,
} from '../../types/drag';
import { registerTarget, registerMonitor } from '../../utils/drag-and-drop/registrations';
import type { RegisterTargetParameters } from '../../utils/drag-and-drop/dropTarget';
import { scheduleDropTargetParameterRefresh } from '../../utils/drag-and-drop/core/lifecycleManager';
import { dragSessionStore, dragSourceStore } from '../../utils/drag-and-drop/dragSessionStore';
import {
  resolveCollision,
  type CollisionResolutionRegistration,
} from '../../utils/drag-and-drop/collisionResolution';
import { createKind } from '../../utils/drag-and-drop/dragKind';
import { DraggableCollisionContext, type CollisionParticipant } from './DraggableCollisionContext';
import { useDraggableContext } from '../DraggableContext';

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
  // The participant records whose geometry was frozen for this drag.
  const captured = useRefWithInit(() => new WeakSet<DraggableTargetRecord>()).current;
  const targetKind = useRefWithInit(() =>
    createKind<TPayload, TDragData>('collision-participant'),
  ).current;
  const involvedRef = React.useRef(false);
  const removedSource = React.useRef<DragSource | null>(null);
  const previous = React.useRef<DraggableTargetRecord<TPayload, TDragData> | null>(null);
  // The start of a drag this group did not own, replayed to `onMoveStart` if the
  // drag later reaches one of its participants, so the start/end pair always closes.
  const pendingStart = React.useRef<{
    value: DraggableCollisionProviderMoveStartValue<TPayload, TDragData>;
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
        | (RegisterTargetParameters<TPayload, TPayload, TDragData, TDragData> &
            CollisionResolutionRegistration<TPayload, TDragData>)
        | null = null;
      const unregister = registerTarget<TPayload, TPayload, TDragData, TDragData>(element, () => {
        const participant = getParticipant();
        const config = getProps();
        if (registration !== null && participant === lastParticipant && config === lastConfig) {
          return registration;
        }
        lastParticipant = participant;
        lastConfig = config;
        registration = {
          [resolveCollision]: (
            record: DraggableTargetRecord<TPayload, TDragData>,
            context: { source: DragSource },
          ) => {
            if (sourceElement === context.source.element || captured.has(record)) {
              return;
            }
            // Freeze both the geometry and dynamic snap steps before source or target
            // callbacks can reorder items. The readers memoize these values per record.
            record.getLocalPoint();
            record.getSnappedLocalPoint();
            captured.add(record);
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
      });
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
  // participants; the source's own participant is never captured.
  const resolve = (
    target: DraggableTargetRecord | null | undefined,
  ): DraggableTargetRecord<TPayload, TDragData> | null =>
    target && targetKind.matches(target) && captured.has(target) ? target : null;

  const markInvolved = () => {
    if (involvedRef.current) {
      return;
    }
    involvedRef.current = true;
    const start = pendingStart.current;
    pendingStart.current = null;
    if (start) {
      props.onMoveStart?.(start.value, start.details);
    }
  };

  const update = (
    value: DragSourceEventValue<TPayload, TDragData>,
    details: BaseUIGenericEventDetails<DropTargetChangeReason, DragEventDetailsProperties>,
  ) => {
    const target = resolve(value.target);
    if (target) {
      markInvolved();
      // The replayed start callback can cancel this drag synchronously.
      if (dragSessionStore.state?.source !== value.source) {
        return;
      }
    }
    const previousTarget = previous.current;
    // Target changes and movement can dispatch the same resolved record. Deliver
    // it once, but report every new sample within a participant and the first leave.
    if (target === previousTarget) {
      return;
    }
    previous.current = target;
    props.onCollisionChange?.({ source: value.source, target }, { ...details, previousTarget });
  };

  const getMonitor = useStableCallback(() => ({
    accept: props.kind,
    onMoveStart(value: DragSourceEventValue<TPayload, TDragData>, details: MoveStartEventDetails) {
      previous.current = null;
      involvedRef.current =
        participants.has(value.source.element) || removedSource.current === value.source;
      removedSource.current = null;
      pendingStart.current = null;
      const startValue = { source: value.source, target: resolve(value.target) };
      if (involvedRef.current) {
        props.onMoveStart?.(startValue, details);
      } else {
        pendingStart.current = { value: startValue, details };
      }
    },
    onMove: update,
    onTargetChange: update,
    onMoveEnd(
      value: DragSourceEventValue<TPayload, TDragData>,
      details: BaseUIGenericEventDetails<DragEndReason, DragEventDetailsProperties>,
    ) {
      const target = resolve(value.target);
      const previousTarget = previous.current;
      if (target) {
        markInvolved();
      }
      const involved = involvedRef.current;
      involvedRef.current = false;
      pendingStart.current = null;
      previous.current = null;
      if (involved) {
        props.onMoveEnd?.({ source: value.source, target }, { ...details, previousTarget });
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
    | ((
        value: DraggableCollisionProviderMoveStartValue<TPayload, TDragData>,
        eventDetails: DraggableCollisionProviderMoveStartEventDetails,
      ) => void)
    | undefined;
  /**
   * Event handler called when the item under the pointer changes, including when
   * the pointer leaves the group. `target` is the item under the pointer, or `null`
   * when outside the group or over the dragged item. Compare it with
   * `eventDetails.previousTarget` to skip updates when the insertion position hasn't changed.
   */
  onCollisionChange?:
    | ((
        value: DraggableCollisionProviderCollisionChangeValue<TPayload, TDragData>,
        eventDetails: DraggableCollisionProviderCollisionChangeEventDetails<TPayload, TDragData>,
      ) => void)
    | undefined;
  /**
   * Event handler called when a drag that involved this group ends.
   * Use `target` to apply the final position. It is `null` when the drag was canceled,
   * released outside the group, or released over the dragged item.
   */
  onMoveEnd?:
    | ((
        value: DraggableCollisionProviderMoveEndValue<TPayload, TDragData>,
        eventDetails: DraggableCollisionProviderMoveEndEventDetails<TPayload, TDragData>,
      ) => void)
    | undefined;
}

/**
 * The first argument of the collision provider's handlers: the dragged item and the
 * item of the group under the pointer.
 */
type DraggableCollisionProviderValue<TPayload, TDragData> = DragSourceEventValue<
  TPayload,
  TDragData,
  TPayload,
  TDragData
>;

/** The properties the collision provider's details add to the drag event details. */
type DraggableCollisionProviderEventDetailsProperties<TPayload, TDragData> =
  DragEventDetailsProperties & {
    /** The `target` reported by the previous `onCollisionChange` call, or `null` before the first. */
    previousTarget: DraggableTargetRecord<TPayload, TDragData> | null;
  };

export type DraggableCollisionProviderMoveStartValue<
  TPayload = unknown,
  TDragData = unknown,
> = DraggableCollisionProviderValue<TPayload, TDragData>;
export type DraggableCollisionProviderMoveStartEventDetails = MoveStartEventDetails;
export type DraggableCollisionProviderMoveStartEventReason =
  DraggableCollisionProviderMoveStartEventDetails['reason'];
export type DraggableCollisionProviderCollisionChangeValue<
  TPayload = unknown,
  TDragData = unknown,
> = DraggableCollisionProviderValue<TPayload, TDragData>;
export type DraggableCollisionProviderCollisionChangeEventReason = DropTargetChangeReason;
export type DraggableCollisionProviderCollisionChangeEventDetails<
  TPayload = unknown,
  TDragData = unknown,
> = BaseUIGenericEventDetails<
  DraggableCollisionProviderCollisionChangeEventReason,
  DraggableCollisionProviderEventDetailsProperties<TPayload, TDragData>
>;
export type DraggableCollisionProviderMoveEndValue<
  TPayload = unknown,
  TDragData = unknown,
> = DraggableCollisionProviderValue<TPayload, TDragData>;
export type DraggableCollisionProviderMoveEndEventReason = DragEndReason;
export type DraggableCollisionProviderMoveEndEventDetails<
  TPayload = unknown,
  TDragData = unknown,
> = BaseUIGenericEventDetails<
  DraggableCollisionProviderMoveEndEventReason,
  DraggableCollisionProviderEventDetailsProperties<TPayload, TDragData>
>;

export namespace DraggableCollisionProvider {
  export type MoveStartValue<
    TPayload = unknown,
    TDragData = unknown,
  > = DraggableCollisionProviderMoveStartValue<TPayload, TDragData>;
  export type MoveStartEventDetails = DraggableCollisionProviderMoveStartEventDetails;
  export type MoveStartEventReason = DraggableCollisionProviderMoveStartEventReason;
  export type CollisionChangeValue<
    TPayload = unknown,
    TDragData = unknown,
  > = DraggableCollisionProviderCollisionChangeValue<TPayload, TDragData>;
  export type CollisionChangeEventDetails<
    TPayload = unknown,
    TDragData = unknown,
  > = DraggableCollisionProviderCollisionChangeEventDetails<TPayload, TDragData>;
  export type CollisionChangeEventReason = DraggableCollisionProviderCollisionChangeEventReason;
  export type MoveEndValue<
    TPayload = unknown,
    TDragData = unknown,
  > = DraggableCollisionProviderMoveEndValue<TPayload, TDragData>;
  export type MoveEndEventDetails<
    TPayload = unknown,
    TDragData = unknown,
  > = DraggableCollisionProviderMoveEndEventDetails<TPayload, TDragData>;
  export type MoveEndEventReason = DraggableCollisionProviderMoveEndEventReason;
  export type Props<TPayload = unknown, TDragData = unknown> = DraggableCollisionProviderProps<
    TPayload,
    TDragData
  >;
}
