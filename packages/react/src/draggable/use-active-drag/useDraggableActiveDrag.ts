'use client';
import { useStore } from '@base-ui/utils/store';
import { dragSourceStore } from '../../utils/drag-and-drop/dragSessionStore';
import { matchesAccept } from '../../utils/drag-and-drop/dragKind';
import type { AcceptedDragPayload, AnyDragAccept, DragKind, DragSource } from '../../types/drag';

export type UseDraggableActiveDragReturnValue<TData = unknown> = DragSource<TData> | null;

/**
 * Subscribes to the drag currently in progress, and returns its source, or `null` if
 * there is none. Observes every drag, regardless of which element started it.
 *
 * Pass one kind or an array of kinds to `accept` to observe only matching drags.
 * Other drags return `null`, and `accept` determines the source payload type.
 *
 * @public
 */
// The type argument is the `accept` value rather than the payload it promises, so the
// returned payload type is backed by the runtime filter. See `AnyDragAccept`.
export function useDraggableActiveDrag<TAccept extends AnyDragAccept = DragKind<unknown>>(
  accept?: TAccept,
): UseDraggableActiveDragReturnValue<AcceptedDragPayload<TAccept>> {
  // The filter lives inside the selector so a drag this consumer rejects stays
  // `null` across the store's publishes: a drag of another kind starting, ending,
  // or retargeting then re-renders none of the (possibly many) rejecting
  // consumers. An inline `accept` array only re-runs the selector once per render.
  const source = useStore(dragSourceStore, selectAcceptedDragSource, accept);
  return source as DragSource<AcceptedDragPayload<TAccept>> | null;
}

function selectAcceptedDragSource(
  source: DragSource | null,
  accept: AnyDragAccept | undefined,
): DragSource | null {
  if (source === null || !matchesAccept(accept, source)) {
    return null;
  }
  return source;
}

// Keyed on the observed payload rather than on an `accept` value, like the props types.
export namespace useDraggableActiveDrag {
  export type ReturnValue<TData = unknown> = UseDraggableActiveDragReturnValue<TData>;
}
