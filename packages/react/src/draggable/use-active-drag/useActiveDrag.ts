'use client';
import { useStore } from '@base-ui/utils/store';
import { dragSourceStore } from '../../utils/drag-and-drop/dragSessionStore';
import { matchesAccept } from '../../utils/drag-and-drop/dragKind';
import type { AcceptedDragPayload, AcceptedDragData } from '../../utils/drag-and-drop/types';
import type { DraggableAccept } from '../DraggableProvider';
import type { DraggableRootRecord } from '../root/DraggableRoot';

export type UseActiveDragReturnValue<TPayload = unknown, TDragData = unknown> = DraggableRootRecord<
  TPayload,
  TDragData
> | null;

/**
 * Returns the source of the drag in progress, or `null` when nothing is being dragged.
 * Observes every drag on the page, wherever it started.
 *
 * Pass one or more kinds to observe only matching drags and type `source.payload`.
 * Other drags return `null`.
 */
// The type argument is the `accept` value rather than the payload it promises, so the
// returned payload type is backed by the runtime filter.
export function useActiveDrag<TAccept extends DraggableAccept<unknown> | undefined>(
  accept: TAccept,
): UseActiveDragReturnValue<AcceptedDragPayload<TAccept>, AcceptedDragData<TAccept>>;
export function useActiveDrag(accept?: undefined): UseActiveDragReturnValue;
export function useActiveDrag(accept?: DraggableAccept<unknown>): UseActiveDragReturnValue {
  // The filter lives inside the selector so a drag this consumer rejects stays
  // `null` across the store's publishes: a drag of another kind starting, ending,
  // or retargeting then re-renders none of the (possibly many) rejecting
  // consumers. An inline `accept` array only re-runs the selector once per render.
  const source = useStore(dragSourceStore, selectAcceptedDragSource, accept);
  return source;
}

function selectAcceptedDragSource(
  source: DraggableRootRecord | null,
  accept: DraggableAccept<unknown> | undefined,
): DraggableRootRecord | null {
  if (source === null || !matchesAccept(accept, source)) {
    return null;
  }
  return source;
}

// Keyed on the observed payload rather than on an `accept` value, like the props types.
export namespace useActiveDrag {
  export type ReturnValue<TPayload = unknown, TDragData = unknown> = UseActiveDragReturnValue<
    TPayload,
    TDragData
  >;
}
