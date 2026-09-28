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
// The type argument is the `accept` value, not a payload type, so the returned
// payload type always matches the runtime filter.
export function useActiveDrag<TAccept extends DraggableAccept<unknown> | undefined>(
  accept: TAccept,
): UseActiveDragReturnValue<AcceptedDragPayload<TAccept>, AcceptedDragData<TAccept>>;
export function useActiveDrag(accept?: undefined): UseActiveDragReturnValue;
export function useActiveDrag(accept?: DraggableAccept<unknown>): UseActiveDragReturnValue {
  // Filtering inside the selector keeps a rejected drag at `null` across store
  // updates. A drag of another kind can start, end, or retarget without
  // re-rendering any consumer that rejects it. An inline `accept` array only
  // re-runs the selector once per render.
  return useStore(dragSourceStore, selectAcceptedDragSource, accept);
}

function selectAcceptedDragSource(
  source: DraggableRootRecord | null,
  accept: DraggableAccept<unknown> | undefined,
): DraggableRootRecord | null {
  return source !== null && matchesAccept(accept, source) ? source : null;
}

// Typed by the observed payload, not by an `accept` value, like the props types.
export namespace useActiveDrag {
  export type ReturnValue<TPayload = unknown, TDragData = unknown> = UseActiveDragReturnValue<
    TPayload,
    TDragData
  >;
}
