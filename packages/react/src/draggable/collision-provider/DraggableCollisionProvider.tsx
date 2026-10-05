'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import type { BaseUIGenericEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import type {
  DragEndEventDetailsProperties,
  DragEndReason,
  DragEventDetailsProperties,
  DragStartReason,
  DropTargetChangeEventDetails,
  DropTargetChangeReason,
  MoveEndEventDetails,
  MoveStartEventDetails,
} from '../../utils/drag-and-drop/types';
import { createDragEventDetails } from '../../utils/drag-and-drop/dragEventDetails';
import type { DraggableKind } from '../DraggableProvider';
import type { DraggableRootRecord } from '../root/DraggableRoot';
import type {
  DraggableTargetRecord,
  DraggableTargetResolutionContext,
} from '../target/DraggableTarget';
import { registerTarget, registerMonitor } from '../../utils/drag-and-drop/registrations';
import { resolveCollision } from '../../utils/drag-and-drop/dropTarget';
import type {
  CollisionResolutionRegistration,
  DropTargetParameters,
} from '../../utils/drag-and-drop/dropTarget';
import { scheduleDropTargetParameterRefresh } from '../../utils/drag-and-drop/core/lifecycleManager';
import { dragSessionStore, dragSourceStore } from '../../utils/drag-and-drop/dragSessionStore';
import { createKind } from '../../utils/drag-and-drop/dragKind';
import { DraggableCollisionContext } from './DraggableCollisionContext';
import type { CollisionParticipant } from './DraggableCollisionContext';
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
  const removedSource = React.useRef<DraggableRootRecord | null>(null);
  const previous = React.useRef<DraggableTargetRecord<TPayload, TDragData> | null>(null);
  // The start of a drag this group did not own, replayed to `onMoveStart` if the
  // drag later reaches one of its participants, so every `onMoveEnd` has a matching start.
  const pendingStart = React.useRef<MoveStartEventDetails<TPayload, TDragData> | null>(null);

  const register = useStableCallback(
    (
      element: HTMLElement,
      getParticipant: () => CollisionParticipant,
      sourceElement: HTMLElement,
    ) => {
      participants.set(sourceElement, (participants.get(sourceElement) ?? 0) + 1);
      participantElements.add(element);
      // Rebuilt only when the participant or this provider's props change. The
      // engine reads the getter at least twice per frame per walked target and
      // snapshots registrations by identity, so a new object on every call would
      // be copied every frame.
      let lastParticipant: CollisionParticipant | null = null;
      let lastConfig: DraggableCollisionProviderProps<TPayload, TDragData> | null = null;
      let registration:
        | (DropTargetParameters<TPayload, TPayload, TDragData, TDragData> &
            CollisionResolutionRegistration)
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
          [resolveCollision]: (record, source) => {
            if (sourceElement === source.element || captured.has(record)) {
              return;
            }
            // Freeze the geometry and the dynamic snap steps before source or target
            // callbacks can reorder items. The snapped read measures the raw point too,
            // and the readers memoize both per record.
            record.getSnappedLocalPoint();
            captured.add(record);
          },
          snap: participant.snap,
          kind: targetKind,
          accept: config.kind,
          payload: participant.payload as TPayload,
          disabled: participant.disabled || participant.kind.id !== config.kind.id,
          canDrop: (context) =>
            config.canCollide?.({ ...context, payload: participant.payload as TPayload }) ?? true,
        };
        return registration;
      });
      return () => {
        // A source callback can unmount its row before the start monitor runs.
        // Read the session store, whose `source` keeps the identity that every event
        // of the drag reports. `dragSourceStore` publishes copies for reactive
        // subscribers.
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

  // Only this provider's `resolveCollision` fills `captured`, and it skips the source's
  // own participant. `targetKind.matches` narrows the payload type.
  const resolve = (
    target: DraggableTargetRecord | null | undefined,
  ): DraggableTargetRecord<TPayload, TDragData> | null =>
    target && captured.has(target) && targetKind.matches(target) ? target : null;

  // A drag that started elsewhere joins the group when it first reaches one of its
  // items. Its start is replayed with that item as `target`.
  const markInvolved = (
    target: DraggableTargetRecord<TPayload, TDragData>,
    eventDetails: Pick<DropTargetChangeEventDetails<TPayload, TDragData>, 'location' | 'source'>,
  ) => {
    if (involvedRef.current) {
      return;
    }
    involvedRef.current = true;
    const start = pendingStart.current;
    pendingStart.current = null;
    if (start) {
      props.onMoveStart?.({ ...start, target });
    } else {
      // This provider mounted after the drag started, so its monitor missed the
      // start. Report one from the event that reached the group, so `onMoveEnd`
      // still has a matching start. How the drag started is unknown here.
      props.onMoveStart?.(
        createDragEventDetails(
          REASONS.pointer,
          undefined,
          eventDetails.location,
          eventDetails.source,
          target,
        ) as DraggableCollisionProviderMoveStartEventDetails<TPayload, TDragData>,
      );
    }
  };

  const update = (eventDetails: DropTargetChangeEventDetails<TPayload, TDragData>) => {
    const target = resolve(eventDetails.target);
    if (target) {
      markInvolved(target, eventDetails);
      // The replayed start callback can cancel this drag synchronously.
      if (dragSessionStore.state?.source !== eventDetails.source) {
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
    props.onCollisionChange?.({ ...eventDetails, target, previousTarget });
  };

  const getMonitor = useStableCallback(() => ({
    accept: props.kind,
    onMoveStart(eventDetails: MoveStartEventDetails<TPayload, TDragData>) {
      const source = eventDetails.source;
      previous.current = null;
      involvedRef.current = participants.has(source.element) || removedSource.current === source;
      removedSource.current = null;
      pendingStart.current = null;
      if (involvedRef.current) {
        // The engine captures participants from the first move or target change
        // on, so a drag starting in this group has no target yet.
        props.onMoveStart?.({ ...eventDetails, target: null });
      } else {
        pendingStart.current = eventDetails;
      }
    },
    onMove: update,
    onTargetChange: update,
    onMoveEnd(eventDetails: MoveEndEventDetails<TPayload, TDragData>) {
      const target = resolve(eventDetails.target);
      const previousTarget = previous.current;
      if (target) {
        markInvolved(target, eventDetails);
      }
      const involved = involvedRef.current;
      involvedRef.current = false;
      pendingStart.current = null;
      previous.current = null;
      if (involved) {
        props.onMoveEnd?.({ ...eventDetails, target, previousTarget });
      }
    },
  }));
  useIsoLayoutEffect(() => registerMonitor(getMonitor), [getMonitor]);

  const firstParameterEffect = React.useRef(true);
  useIsoLayoutEffect(() => {
    if (firstParameterEffect.current) {
      firstParameterEffect.current = false;
    } else if (dragSourceStore.state && props.kind.matches(dragSourceStore.state)) {
      // Refresh only this group's participants. An inline `canCollide` gets a new
      // identity on every render, and a page-wide refresh would re-resolve every
      // target per frame.
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
  kind: DraggableKind<TPayload, TDragData>;
  /**
   * Whether the dragged item can be dropped on a given item of this group.
   * Receives the drag `source`, the pointer `input`, the item's `payload` and `element`,
   * and `getLocalPoint()` for where the pointer is within the item.
   * Return `false` to skip the item, or `'reject'` to block the drop.
   */
  canCollide?:
    | ((
        context: DraggableTargetResolutionContext<TPayload, TDragData> & { payload: TPayload },
      ) => boolean | 'reject')
    | undefined;
  /**
   * Event handler called when an item of this group starts dragging, or when a drag
   * that started elsewhere first enters the group.
   */
  onMoveStart?:
    | ((eventDetails: DraggableCollisionProviderMoveStartEventDetails<TPayload, TDragData>) => void)
    | undefined;
  /**
   * Event handler called when the item under the pointer changes, including when
   * the pointer leaves the group. `eventDetails.target` is the item under the pointer,
   * or `null` when outside the group or over the dragged item. Compare it with
   * `eventDetails.previousTarget` to skip updates when the insertion position hasn't changed.
   */
  onCollisionChange?:
    | ((
        eventDetails: DraggableCollisionProviderCollisionChangeEventDetails<TPayload, TDragData>,
      ) => void)
    | undefined;
  /**
   * Event handler called when a drag that involved this group ends.
   * Use `eventDetails.target` to apply the final position. It is `null` when the drag was
   * canceled, released outside the group, or released over the dragged item.
   * `eventDetails.canceled` tells a cancel from a release.
   */
  onMoveEnd?:
    | ((eventDetails: DraggableCollisionProviderMoveEndEventDetails<TPayload, TDragData>) => void)
    | undefined;
}

/**
 * The properties the collision provider's details add to the drag event details: the
 * dragged item and the item of the group under the pointer.
 */
interface DraggableCollisionProviderEventDetailsProperties<
  TPayload,
  TDragData,
> extends DragEventDetailsProperties {
  /** The item being dragged. */
  source: DraggableRootRecord<TPayload, TDragData>;
  /**
   * The item of this group under the pointer, or `null` when the pointer is outside the
   * group or over the dragged item. Use `payload` to identify it, and `getLocalPoint()`
   * or `getSnappedLocalPoint()` to decide on which side of it to insert.
   *
   * In `onMoveStart`, it is `null` when the drag starts on an item of the group, and
   * the item the drag first reached when it started elsewhere. In `onMoveEnd`, a release
   * over the dragged item itself is a drop with a `null` target. `canceled` tells it
   * apart from a cancel, and `reason` (`'drop'`) from a release outside the group.
   */
  target: DraggableTargetRecord<TPayload, TDragData> | null;
}

/** The property the details of `onCollisionChange` and `onMoveEnd` add. */
interface DraggableCollisionProviderPreviousTarget<TPayload, TDragData> {
  /**
   * The `target` reported by the previous `onCollisionChange` call, or `null` before
   * the first. Records are rebuilt as the pointer moves, so compare `payload` or
   * `element` to tell whether the item changed.
   */
  previousTarget: DraggableTargetRecord<TPayload, TDragData> | null;
}

export type DraggableCollisionProviderMoveStartEventDetails<
  TPayload = unknown,
  TDragData = unknown,
> = BaseUIGenericEventDetails<
  DragStartReason,
  DraggableCollisionProviderEventDetailsProperties<TPayload, TDragData>
>;
export type DraggableCollisionProviderMoveStartEventReason =
  DraggableCollisionProviderMoveStartEventDetails['reason'];
export type DraggableCollisionProviderCollisionChangeEventDetails<
  TPayload = unknown,
  TDragData = unknown,
> = BaseUIGenericEventDetails<
  DropTargetChangeReason,
  DraggableCollisionProviderEventDetailsProperties<TPayload, TDragData> &
    DraggableCollisionProviderPreviousTarget<TPayload, TDragData>
>;
export type DraggableCollisionProviderCollisionChangeEventReason =
  DraggableCollisionProviderCollisionChangeEventDetails['reason'];
export type DraggableCollisionProviderMoveEndEventDetails<
  TPayload = unknown,
  TDragData = unknown,
> = BaseUIGenericEventDetails<
  DragEndReason,
  DraggableCollisionProviderEventDetailsProperties<TPayload, TDragData> &
    DragEndEventDetailsProperties &
    DraggableCollisionProviderPreviousTarget<TPayload, TDragData>
>;
export type DraggableCollisionProviderMoveEndEventReason =
  DraggableCollisionProviderMoveEndEventDetails['reason'];

export namespace DraggableCollisionProvider {
  export type MoveStartEventDetails<
    TPayload = unknown,
    TDragData = unknown,
  > = DraggableCollisionProviderMoveStartEventDetails<TPayload, TDragData>;
  export type MoveStartEventReason = DraggableCollisionProviderMoveStartEventReason;
  export type CollisionChangeEventDetails<
    TPayload = unknown,
    TDragData = unknown,
  > = DraggableCollisionProviderCollisionChangeEventDetails<TPayload, TDragData>;
  export type CollisionChangeEventReason = DraggableCollisionProviderCollisionChangeEventReason;
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
