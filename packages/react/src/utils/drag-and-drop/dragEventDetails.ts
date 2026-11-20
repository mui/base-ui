/** Builds the `eventDetails` of the drag lifecycle handlers, `onMoveStart` to `onMoveEnd`. */

import { createGenericEventDetails } from '../../internals/createBaseUIEventDetails';
import type { ReasonToEvent } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import type { DraggableLocationHistory } from '../../draggable/DraggableProvider';
import type { DraggableRootRecord } from '../../draggable/root/DraggableRoot';
import type { DraggableTargetRecord } from '../../draggable/target/DraggableTarget';
import type {
  DragEndReason,
  DragEventDetails,
  DropTargetChangeReason,
  MoveEndEventDetails,
} from './types';

/**
 * The details the source and monitors receive, where `target` is the innermost drop
 * target. Each drop target gets a copy with its own `currentTarget` (see
 * `dispatchToDropTarget`). Without a native `event`, as with `cancelDrag()`, Base UI's
 * placeholder event is used, so `eventDetails.event` is never `undefined`.
 */
export function createDragEventDetails<TReason extends DropTargetChangeReason>(
  reason: TReason,
  event: Event | undefined,
  location: DraggableLocationHistory,
  source: DraggableRootRecord,
  target: DraggableTargetRecord | null,
): DragEventDetails<TReason> {
  return createGenericEventDetails(reason, event as ReasonToEvent<TReason> | undefined, {
    location,
    source,
    target,
  }) as DragEventDetails<TReason>;
}

/** `target` is the drop target that received the drop, or `null`. */
export function createMoveEndEventDetails(
  reason: DragEndReason,
  event: Event | undefined,
  location: DraggableLocationHistory,
  source: DraggableRootRecord,
  target: DraggableTargetRecord | null,
): MoveEndEventDetails {
  return createGenericEventDetails(reason, event as ReasonToEvent<DragEndReason> | undefined, {
    location,
    source,
    target,
    canceled: reason !== REASONS.drop && reason !== REASONS.outsideRelease,
  }) as MoveEndEventDetails;
}
