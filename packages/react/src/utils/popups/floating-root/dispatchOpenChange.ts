import type { BaseUIChangeEventDetails } from '../../../internals/createBaseUIEventDetails';
import type { FloatingUIOpenChangeDetails } from '../../../internals/types';
import { isClickLikeEvent } from '../event';
import type { FloatingRootContextValues } from './types';

/**
 * Tells a popup's interaction hooks about an accepted open change: records the event that opened
 * it, then emits `openchange`.
 *
 * @param context The context of the interaction hooks' store.
 * @param open Whether the popup is open before the change.
 * @param newOpen Whether the popup is open after the change.
 * @param eventDetails Details about the event that caused the change.
 */
export function dispatchOpenChange(
  context: Pick<FloatingRootContextValues, 'dataRef' | 'events' | 'nested'>,
  open: boolean,
  newOpen: boolean,
  eventDetails: BaseUIChangeEventDetails<string>,
) {
  const event = eventDetails.event;

  // The open event tells hover logic a hover-open from a click-like open.
  if (
    !newOpen ||
    !open ||
    // Prevent a pending hover-open from overwriting a click-open event, while allowing
    // click events to upgrade a hover-open.
    (event != null && isClickLikeEvent(event))
  ) {
    context.dataRef.current.openEvent = newOpen ? event : undefined;
  }

  const details: FloatingUIOpenChangeDetails = {
    open: newOpen,
    reason: eventDetails.reason,
    nativeEvent: event,
    nested: context.nested,
    triggerElement: eventDetails.trigger,
  };

  context.events.emit('openchange', details);
}
