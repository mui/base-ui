/**
 * Builds the `eventDetails` object every drag handler receives as its second
 * argument, following Base UI's `(payload, eventDetails)` convention.
 *
 * Not `createGenericEventDetails` from Base UI: that one is typed
 * `Reason extends keyof ReasonToEventMap`, so it accepts only Base UI's canonical
 * reasons and cannot express drag-specific ones like `'missed-release'`. The
 * alternative, `createChangeEventDetails`, takes any string but carries
 * `cancel()` / `allowPropagation()` / `isCanceled` — a footgun on events that
 * have already happened and cannot be canceled. Hence this local factory:
 * `reason` and the native `event`, nothing else.
 *
 * Reasons reuse Base UI's canonical strings wherever one fits (`'escape-key'`,
 * `'focus-out'`, `'imperative-action'`, `'pointer'`, `'keyboard'`), so
 * `ReasonToEvent` types the native event correctly for those.
 */

import type { DragEventDetails } from '../../types/drag';

/**
 * A drag with no native event behind it — a programmatic `cancelDrag()`, or a
 * teardown scheduled from a frame rather than an input. Mirrors the placeholder
 * Base UI's own factories fall back to, so `eventDetails.event` is never
 * `undefined` and consumers can read it without a guard.
 */
function createPlaceholderEvent(): Event {
  return new Event('base-ui');
}

export function createDragEventDetails<TReason extends string>(
  reason: TReason,
  event?: Event | undefined,
): DragEventDetails<TReason> {
  return {
    reason,
    event: event ?? createPlaceholderEvent(),
  } as DragEventDetails<TReason>;
}
