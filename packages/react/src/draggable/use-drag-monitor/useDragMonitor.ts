'use client';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { registerMonitor } from '../../utils/drag-and-drop/registrations';
import type {
  AcceptedDragPayload,
  AcceptedDragData,
  AnyDragAccept,
  DragKind,
} from '../../types/drag';
import type {
  DragParametersWithInferredAccept,
  RegisterMonitorParameters,
} from '../../types/dragRegistration';

/**
 * Observes every drag on the page that matches `accept`, wherever it started.
 * Use it for status indicators, analytics, or committing drops from one place.
 * A monitor has no element and needs no `<Draggable.Provider>`.
 *
 * Documentation: [Base UI useMonitor](https://base-ui.com/react/utils/draggable#usemonitor)
 *
 * @public
 */
// The type argument is the `accept` value rather than the payload it promises, so
// `accept: [task, file]` types `source.payload` as the union of theirs. See `AnyDragAccept`.
export function useDragMonitor<TAccept extends AnyDragAccept = DragKind<unknown>>(
  parameters: DragParametersWithInferredAccept<
    UseDragMonitorParameters<AcceptedDragPayload<TAccept>, AcceptedDragData<TAccept>>,
    TAccept
  >,
): void {
  const getParameters = useStableCallback(() => parameters);
  useIsoLayoutEffect(() => registerMonitor<TAccept>(getParameters), [getParameters]);
}

// Keyed on the observed payload rather than on an `accept` value, like the props types.
export namespace useDragMonitor {
  export type Parameters<TSourcePayload = unknown, TDragData = unknown> = UseDragMonitorParameters<
    TSourcePayload,
    TDragData
  >;
  export type ReturnValue = void;
}

/**
 * The kinds to observe and the event handlers called for every matching drag.
 */
export type UseDragMonitorParameters<
  TSourcePayload = unknown,
  TDragData = unknown,
> = RegisterMonitorParameters<TSourcePayload, TDragData>;

export type { RegisterMonitorParameters } from '../../types/dragRegistration';

// The event types a monitor's extracted handlers are written against,
// re-exported so this entry point is self-sufficient like the component entries
// (they also remain available from `@base-ui/react/types`; both resolve to the
// same declarations, so the star exports stay unambiguous).
export type {
  BaseDragEvent,
  DragDropEvent,
  DragDropEventDetails,
  MoveEndEvent,
  MoveEndEventDetails,
  DraggableEventMap,
  MoveEvent,
  MoveEventDetails,
  DragMoveReason,
  MoveStartEvent,
  MoveStartEventDetails,
  DropTargetChangeEvent,
  DropTargetChangeEventDetails,
} from '../../types/drag';
