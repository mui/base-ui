'use client';
import { useStore } from '@base-ui/utils/store';
import { dragSourceStore, selectDragSource } from '../../utils/drag-and-drop/dragSessionStore';
import { matchesAccept } from '../../utils/drag-and-drop/dragKind';
import type { AcceptedDragPayload, AnyDragAccept, DragKind, DragSource } from '../../types/drag';

export type UseDraggableActiveDragReturnValue<TData = unknown> = DragSource<TData> | null;

/**
 * Subscribes to the drag currently in progress, and returns its source, or `null` if
 * there is none. Observes every drag, regardless of which element started it.
 *
 * Pass `accept` — one kind, or an array of them — to observe only those kinds: other
 * drags return `null`, and the source's `payload` is typed from it.
 *
 * @public
 */
// The type argument is the `accept` value rather than the payload it promises, so the
// returned payload type is backed by the runtime filter. See `AnyDragAccept`.
export function useDraggableActiveDrag<TAccept extends AnyDragAccept = DragKind<unknown>>(
  accept?: TAccept,
): UseDraggableActiveDragReturnValue<AcceptedDragPayload<TAccept>> {
  const source = useStore(dragSourceStore, selectDragSource);
  if (source === null || !matchesAccept(accept, source)) {
    return null;
  }
  return source as DragSource<AcceptedDragPayload<TAccept>>;
}

// Keyed on the observed payload rather than on an `accept` value, like the props types.
export namespace useDraggableActiveDrag {
  export type ReturnValue<TData = unknown> = UseDraggableActiveDragReturnValue<TData>;
}
