/**
 * Builds the `eventDetails` object every drag handler receives as its second
 * argument: Base UI's generic event details, carrying the drag `location`.
 */

import {
  createGenericEventDetails,
  type ReasonToEvent,
} from '../../internals/createBaseUIEventDetails';
import type { REASONS } from '../../internals/reasons';
import type { DragEventDetails, DragLocationHistory } from '../../types/drag';

type BaseUIReason = (typeof REASONS)[keyof typeof REASONS];

/**
 * `event` is the native event behind the latest input. A drag with no native event
 * behind it, such as a programmatic `cancelDrag()`, gets Base UI's placeholder event,
 * so `eventDetails.event` is never `undefined`.
 */
export function createDragEventDetails<TReason extends BaseUIReason>(
  reason: TReason,
  event: Event | undefined,
  location: DragLocationHistory,
): DragEventDetails<TReason> {
  return createGenericEventDetails(reason, event as ReasonToEvent<TReason> | undefined, {
    location,
  }) as DragEventDetails<TReason>;
}

/** The same `reason` and `event` with another `location`. */
export function withDragLocation<TReason extends string>(
  details: DragEventDetails<TReason>,
  location: DragLocationHistory,
): DragEventDetails<TReason> {
  return { ...details, location };
}
