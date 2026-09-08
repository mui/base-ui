'use client';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { registerMonitor } from '../utils/drag-and-drop/registrations';
import type { RegisterMonitorParameters } from '../utils/drag-and-drop/monitor';
import type { AcceptedDragPayload, AnyDragAccept, DragKind } from '../types/drag';
import type { WithInferredAccept } from '../types/dragRegistration';

/**
 * Observes every drag operation that matches `accept`, regardless of which
 * element started it. Use it for status indicators, analytics, or committing a
 * reorder on drop.
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
  const getParameters = useStableCallback(() => parameters);
  useIsoLayoutEffect(() => registerMonitor<TAccept>(getParameters), [getParameters]);
}

// Keyed on the observed payload rather than on an `accept` value, like the props types.
export namespace useDragMonitor {
  export type Parameters<TSourceData = unknown> = UseDragMonitorParameters<TSourceData>;
  export type ReturnValue = void;
}

/**
 * Parameters for {@link useDragMonitor}. Defines the drag kinds to observe and the
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
