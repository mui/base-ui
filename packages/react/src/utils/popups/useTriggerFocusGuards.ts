'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { ownerDocument } from '@base-ui/utils/owner';
import {
  contains,
  type FocusableElement,
  isOutsideEvent,
  isTabbable,
  tabbable,
} from '../../floating-ui-react/utils';
import {
  type BaseUIChangeEventDetails,
  createChangeEventDetails,
} from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';

/**
 * Minimal store interface required by the focus guard hook.
 * Both PopoverStore and MenuStore satisfy this interface.
 */
interface TriggerFocusGuardStore {
  setOpen(open: boolean, eventDetails: BaseUIChangeEventDetails<typeof REASONS.focusOut>): void;
  select(key: 'positionerElement'): HTMLElement | null;
  context: {
    readonly beforeContentFocusGuardRef: React.RefObject<HTMLElement | null>;
    readonly triggerFocusTargetRef: React.RefObject<HTMLElement | null>;
  };
}

/**
 * Collects the tabbable elements that follow `anchor` in `dir` order, as a single ordered
 * snapshot of the document's tab order taken *before* the popup closes.
 *
 * Closing a popup synchronously (`flushSync`) unmounts the guard that received focus, so the
 * destination cannot be resolved afterwards: the index-based tabbable helpers locate their
 * reference by position in the document tab order and return `null` once it is detached.
 * Elements inside the positioner are dropped here because it becomes `inert` on close.
 *
 * The list wraps around, mirroring how the previous index-based helpers behaved, and is bounded
 * by the already-finite tabbable snapshot: `focusFirstAvailable` almost always takes the first
 * entry, and the rest only cover the case where the destination did not survive the close.
 */
function getOrderedCandidates(
  anchor: HTMLElement | null,
  positionerElement: HTMLElement | null,
  dir: 1 | -1,
): FocusableElement[] {
  if (!anchor) {
    return [];
  }

  const list = tabbable(ownerDocument(anchor).body);
  const index = list.indexOf(anchor as FocusableElement);
  if (index === -1) {
    return [];
  }

  const candidates: FocusableElement[] = [];
  for (let step = 1; step < list.length; step += 1) {
    const nextIndex = (((index + dir * step) % list.length) + list.length) % list.length;
    const candidate = list[nextIndex];
    if (!contains(positionerElement, candidate)) {
      candidates.push(candidate);
    }
  }

  return candidates;
}

/**
 * Focuses the first candidate that survived the close. `isTabbable` already rejects a detached
 * node and anything under an `inert` ancestor, which is what the closing positioner becomes, so
 * no separate containment re-check is needed here. The trigger itself is deliberately not
 * required to remain tabbable.
 */
function focusFirstAvailable(candidates: FocusableElement[]): void {
  for (const candidate of candidates) {
    if (isTabbable(candidate)) {
      candidate.focus();
      return;
    }
  }
}

/**
 * Provides focus guard handlers for popup triggers (Popover, Menu).
 *
 * When the popup is open, invisible focus guard elements are placed before and after
 * the trigger. These handlers close the popup and move focus to the appropriate
 * tabbable element when the guards receive focus (i.e. when the user tabs out).
 */
export function useTriggerFocusGuards(
  store: TriggerFocusGuardStore,
  triggerElementRef: React.RefObject<HTMLElement | null>,
) {
  const preFocusGuardRef = React.useRef<HTMLElement>(null);

  function closeAndMoveFocus(
    event: React.FocusEvent,
    anchor: HTMLElement | null,
    positionerElement: HTMLElement | null,
    dir: 1 | -1,
  ) {
    // Resolve the destination against the pre-close DOM: the anchor is a focus guard that this
    // close unmounts.
    const candidates = getOrderedCandidates(anchor, positionerElement, dir);

    ReactDOM.flushSync(() => {
      store.setOpen(
        false,
        createChangeEventDetails(
          REASONS.focusOut,
          event.nativeEvent,
          event.currentTarget as HTMLElement,
        ),
      );
    });

    focusFirstAvailable(candidates);
  }

  function handlePreFocusGuardFocus(event: React.FocusEvent) {
    closeAndMoveFocus(event, preFocusGuardRef.current, store.select('positionerElement'), -1);
  }

  function handleFocusTargetFocus(event: React.FocusEvent) {
    const positionerElement = store.select('positionerElement');
    const beforeContentFocusGuard = store.context.beforeContentFocusGuardRef.current;

    // Tabbing in from outside the positioner moves focus into the popup content instead of
    // closing. When the popup's own guard is gone there is nothing to move into, so fall through
    // to the close path rather than leaving focus stranded on this guard.
    if (positionerElement && beforeContentFocusGuard && isOutsideEvent(event, positionerElement)) {
      beforeContentFocusGuard.focus();
      return;
    }

    closeAndMoveFocus(
      event,
      store.context.triggerFocusTargetRef.current ?? triggerElementRef.current,
      positionerElement,
      1,
    );
  }

  return { preFocusGuardRef, handlePreFocusGuardFocus, handleFocusTargetFocus };
}
