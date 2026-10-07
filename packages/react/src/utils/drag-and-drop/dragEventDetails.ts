/**
 * Builds the `eventDetails` object of the drag lifecycle handlers, from `onMoveStart`
 * to `onMoveEnd`. It extends Base UI's generic event details with the drag `location`,
 * the dragged `source` and a `target`.
 */

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
 * Creates the details the source and the monitors receive, where `target` is the
 * innermost drop target. Each drop target receives a copy that adds its own record as
 * `currentTarget` (see `dispatchToDropTarget`).
 *
 * `event` is the native event of the latest input. Without one, as with a
 * programmatic `cancelDrag()`, the details get Base UI's placeholder event, so
 * `eventDetails.event` is never `undefined`.
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

/**
 * Creates the details of `onMoveEnd`. `canceled` derives from the reason, and every
 * reason other than `'drop'` and `'outside-release'` is a cancel. `target` is the
 * drop target that received the drop, or `null`.
 */
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
