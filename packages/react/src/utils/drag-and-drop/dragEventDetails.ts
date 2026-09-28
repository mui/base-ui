/**
 * Builds the `eventDetails` object every drag handler receives: Base UI's generic
 * event details, carrying the drag `location`, the dragged `source` and a `target`.
 */

import { createGenericEventDetails } from '../../internals/createBaseUIEventDetails';
import type { ReasonToEvent } from '../../internals/createBaseUIEventDetails';
import type { BaseUIEventReason } from '../../internals/reasons';
import type { DraggableLocationHistory } from '../../draggable/DraggableProvider';
import type { DraggableRootRecord } from '../../draggable/root/DraggableRoot';
import type { DraggableTargetRecord } from '../../draggable/target/DraggableTarget';
import type { DragEndReason, DragEventDetails, MoveEndEventDetails } from './types';

/**
 * The details the source and the monitors receive, with `target` the innermost drop
 * target. Each drop target receives a copy whose `target` is its own record (see
 * `dispatchToDropTarget`).
 *
 * `event` is the native event behind the latest input. A drag with no native event
 * behind it, such as a programmatic `cancelDrag()`, gets Base UI's placeholder event,
 * so `eventDetails.event` is never `undefined`.
 */
export function createDragEventDetails<TReason extends BaseUIEventReason>(
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
 * The details of `onMoveEnd`, whose `canceled` flag is derived from the reason: every
 * reason other than a drop or a release outside any target is a cancel. `target` is the
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
    canceled: reason !== 'drop' && reason !== 'outside-release',
  }) as MoveEndEventDetails;
}
