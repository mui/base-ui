'use client';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useValueAsRef } from '@base-ui/utils/useValueAsRef';
import { registerMonitor } from '../utils/drag-and-drop/registrations';
import type { RegisterMonitorParameters } from '../utils/drag-and-drop/monitor';
import type { AcceptedDragPayload, AnyDragAccept, DragKind } from '../types/drag';
import type { WithInferredAccept } from '../types/dragRegistration';

/**
 * Observes every drag operation, regardless of which element started it, subject
 * to `accept`. Use it for cross-cutting concerns — status indicators,
 * analytics, committing a reorder on drop.
 *
 * Documentation: [Base UI useDragMonitor](https://base-ui.com/react/utils/use-drag-monitor)
 *
 * @public
 */
// The type argument is the `accept` value rather than the payload it promises, so
// `accept: [task, file]` types `source.payload` as the union of theirs. See `AnyDragAccept`.
export function useDragMonitor<TAccept extends AnyDragAccept = DragKind<unknown>>(
  parameters: WithInferredAccept<UseDragMonitorParameters<AcceptedDragPayload<TAccept>>, TAccept>,
): void {
  const paramsRef = useValueAsRef(parameters);
  // `.next`, like every sibling registration (see `useRegistrationRef`):
  // `registrations.ts` dispatches to monitors synchronously from a ref cleanup —
  // the mutation-phase window where `.current` is still the previous render's —
  // so reading `.current` runs a monitor one render stale.
  useIsoLayoutEffect(() => registerMonitor<TAccept>(() => paramsRef.next), [paramsRef]);
}

// Keyed on the observed payload rather than on an `accept` value, like the props types.
export namespace useDragMonitor {
  export type Parameters<TSourceData = unknown> = UseDragMonitorParameters<TSourceData>;
  export type ReturnValue = void;
}

/**
 * Parameters for {@link useDragMonitor}: the drag kinds to observe and the
 * lifecycle callbacks fired for every matching drag.
 */
export interface UseDragMonitorParameters<
  TSourceData = unknown,
> extends RegisterMonitorParameters<TSourceData> {}

export type { RegisterMonitorParameters } from '../utils/drag-and-drop/monitor';

// The event types a monitor's extracted handlers are written against,
// re-exported so this entry point is self-sufficient like the component entries
// (they also remain available from `@base-ui/react/types`; both resolve to the
// same declarations, so the star exports stay unambiguous).
export type {
  BaseDragEvent,
  DragDropEvent,
  DragDropEventDetails,
  DragEndEvent,
  DragEndEventDetails,
  DragEventMap,
  DragMoveEvent,
  DragMoveEventDetails,
  DragStartEvent,
  DragStartEventDetails,
  DropTargetChangeEvent,
  DropTargetChangeEventDetails,
} from '../types/drag';
