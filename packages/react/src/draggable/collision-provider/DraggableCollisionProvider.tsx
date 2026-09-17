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
import { resolveCollision } from '../../utils/drag-and-drop/collisionResolution';
import { createKind } from '../../utils/drag-and-drop/dragKind';
import { isRtlElement } from '../../utils/drag-and-drop/utils';
import { DraggableCollisionContext, type CollisionParticipant } from './DraggableCollisionContext';
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
  const rtlCache = React.useRef(new WeakMap<Element, boolean>());
  const sources = useRefWithInit(() => new WeakMap<Element, HTMLElement>()).current;
  const targetKind = useRefWithInit(() => createKind<TData>('collision-participant')).current;
  const involvedRef = React.useRef(false);
  const previous = React.useRef<DraggableCollision<TData> | null>(null);

  const register = useStableCallback(
    (
      element: HTMLElement,
      getParticipant: () => CollisionParticipant,
      sourceElement: HTMLElement,
    ) => {
      participants.set(sourceElement, (participants.get(sourceElement) ?? 0) + 1);
      sources.set(element, sourceElement);
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
            if (
              config.placement === 'direction' &&
              delta === 0 &&
              previous.current?.target.element !== element
            ) {
              return;
            }
            let placement: 'before' | 'after';
            if (
              config.placement === 'direction' &&
              delta === 0 &&
              previous.current?.target.element === element
            ) {
              placement = previous.current.placement;
            } else {
              const point =
                config.placement === 'direction' && delta !== 0 ? null : record.getLocalPoint();
              let after = point ? (horizontal ? point.x : point.y) > 0.5 : delta > 0;
              if (horizontal) {
                let rtl = rtlCache.current.get(element);
                if (rtl === undefined) {
                  rtl = isRtlElement(element);
                  rtlCache.current.set(element, rtl);
                }
                if (rtl) {
                  after = !after;
                }
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

  const resolve = (
    event: BaseDragEvent<TData>,
    target: DropTargetRecord | null | undefined,
  ): DraggableCollision<TData> | null => {
    if (
      !target ||
      !sources.has(target.element) ||
      !targetKind.matches(target) ||
      sources.get(target.element) === event.source.element
    ) {
      return null;
    }
    return snapshots.get(target) ?? null;
  };

  const update = (event: BaseDragEvent<TData>, details: DropTargetChangeEventDetails) => {
    const collision = resolve(event, event.location.current.dropTargets[0]);
    if (collision) {
      involvedRef.current = true;
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
      if (last) {
        last.target.element.removeAttribute(`data-collision-${last.placement}`);
      }
      if (collision) {
        collision.target.element.setAttribute(`data-collision-${collision.placement}`, '');
      }
      props.onCollisionChange?.({ ...event, collision }, details);
    }
  };

  const getMonitor = useStableCallback(() => ({
    accept: props.kind,
    onMoveStart(event: BaseDragEvent<TData>, details: MoveStartEventDetails) {
      previous.current = null;
      lastInput.current = event.location.current.input;
      rtlCache.current = new WeakMap();
      involvedRef.current = participants.has(event.source.element);
      if (involvedRef.current) {
        props.onMoveStart?.(event, details);
      }
    },
    onMove: update,
    onTargetChange: update,
    onMoveEnd(event: MoveEndEvent<TData>, details: MoveEndEventDetails) {
      const collision = resolve(event, event.dropTarget);
      if (previous.current) {
        previous.current.target.element.removeAttribute(
          `data-collision-${previous.current.placement}`,
        );
      }
      const involved = involvedRef.current || collision;
      involvedRef.current = false;
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
      if (previous.current) {
        previous.current.target.element.removeAttribute(
          `data-collision-${previous.current.placement}`,
        );
        previous.current = null;
      }
    };
  }, [getMonitor]);

  const firstParameterEffect = React.useRef(true);
  useIsoLayoutEffect(() => {
    if (firstParameterEffect.current) {
      firstParameterEffect.current = false;
    } else {
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
