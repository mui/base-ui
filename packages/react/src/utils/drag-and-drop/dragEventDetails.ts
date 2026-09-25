/**
 * Builds the `eventDetails` object every drag handler receives as its second
 * argument: Base UI's generic event details, carrying the drag `location`.
 */

import {
  createGenericEventDetails,
  type ReasonToEvent,
} from '../../internals/createBaseUIEventDetails';
import type { BaseUIEventReason } from '../../internals/reasons';
import type {
  DragEndReason,
  DragEventDetails,
  DraggableLocationHistory,
  MoveEndEventDetails,
} from '../../types/drag';

/**
 * `event` is the native event behind the latest input. A drag with no native event
 * behind it, such as a programmatic `cancelDrag()`, gets Base UI's placeholder event,
 * so `eventDetails.event` is never `undefined`.
 */
export function createDragEventDetails<TReason extends BaseUIEventReason>(
  reason: TReason,
  event: Event | undefined,
  location: DraggableLocationHistory,
): DragEventDetails<TReason> {
  return createGenericEventDetails(reason, event as ReasonToEvent<TReason> | undefined, {
    location,
  }) as DragEventDetails<TReason>;
}

/** The same `reason` and `event` with another `location`. */
export function withDragLocation<TReason extends string>(
  details: DragEventDetails<TReason>,
  location: DraggableLocationHistory,
): DragEventDetails<TReason> {
  return { ...details, location };
}

/**
 * The details of `onMoveEnd`, whose `canceled` flag is derived from the reason: every
 * reason other than a drop or a release outside any target is a cancel.
 */
export function createMoveEndEventDetails(
  reason: DragEndReason,
  event: Event | undefined,
  location: DraggableLocationHistory,
): MoveEndEventDetails {
  return createGenericEventDetails(reason, event as ReasonToEvent<DragEndReason> | undefined, {
    location,
    canceled: reason !== 'drop' && reason !== 'outside-release',
  }) as MoveEndEventDetails;
}
