import * as ReactDOM from 'react-dom';
import type { FloatingRootContext } from '../../floating-ui-react';
import type { BaseUIChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';

/**
 * What a root supplies to `runOpenChange`: its committed state, its consumer, and how to commit.
 */
export interface OpenChangeAdapter<EventDetails> {
  /**
   * The committed open state. Closing a closed popup does nothing. Opening an open one goes
   * through: it can move the popup to another trigger or upgrade a hover open.
   */
  open: boolean;
  /**
   * The consumer's callback, plus anything the root must learn about a request before it's
   * accepted or canceled.
   */
  onOpenChange: ((open: boolean, eventDetails: EventDetails) => void) | undefined;
  /**
   * Reported as the trigger of a close that names none, so the consumer sees what the popup is
   * closing from.
   */
  trigger?: Element | null | undefined;
  /**
   * Declines a change the consumer accepted. Unlike a cancellation, nothing observes it: it's
   * neither recorded as a close request nor emitted.
   */
  refused?: boolean | undefined;
  /**
   * Commits a hover change synchronously, so `getAnimations()` sees the new state.
   */
  flushHover?: boolean | undefined;
  /**
   * Writes an accepted change to the root's state.
   * @param preventUnmountOnClose Whether the consumer asked to keep the popup mounted.
   */
  commit(preventUnmountOnClose: boolean): void;
}

/**
 * Runs an open change request through the sequence every popup root shares: skip a redundant
 * close, let the consumer accept or cancel it, refuse it, record and emit it through the floating
 * root, then commit it through the root's adapter.
 *
 * The consumer runs first, so a canceled change never reaches the floating root's `openchange`
 * subscribers or its close request.
 */
export function runOpenChange<EventDetails extends BaseUIChangeEventDetails<string>>(
  floatingRootContext: FloatingRootContext,
  nextOpen: boolean,
  eventDetails: EventDetails,
  adapter: OpenChangeAdapter<EventDetails>,
) {
  if (!nextOpen && !adapter.open) {
    return;
  }

  let preventUnmountOnClose = false;
  (eventDetails as EventDetails & { preventUnmountOnClose(): void }).preventUnmountOnClose = () => {
    preventUnmountOnClose = true;
  };

  if (!nextOpen && eventDetails.trigger == null) {
    eventDetails.trigger = adapter.trigger ?? undefined;
  }

  adapter.onOpenChange?.(nextOpen, eventDetails);

  if (eventDetails.isCanceled || adapter.refused) {
    return;
  }

  floatingRootContext.dispatchOpenChange(nextOpen, eventDetails);

  const commit = () => adapter.commit(preventUnmountOnClose);
  if (adapter.flushHover && eventDetails.reason === REASONS.triggerHover) {
    ReactDOM.flushSync(commit);
  } else {
    commit();
  }
}
