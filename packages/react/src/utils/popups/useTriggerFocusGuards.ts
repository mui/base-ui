'use client';
import type * as React from 'react';
import * as ReactDOM from 'react-dom';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import type { BaseUIChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import type { PopupInteractionContext } from './types';
import { getTabbableNearElement, isOutsideEvent } from './focus/tabbable';
import { getPopupDismissal } from './interactions/popupDismissal';

/**
 * Minimal store interface required by the focus guard hook.
 * Both PopoverStore and MenuStore satisfy this interface.
 */
interface TriggerFocusGuardStore {
  setOpen(open: boolean, eventDetails: BaseUIChangeEventDetails<typeof REASONS.focusOut>): void;
  select(key: 'positionerElement'): HTMLElement | null;
  context: PopupInteractionContext;
}

/**
 * Focus guard rule: focusing a guard around the trigger closes the popup and moves focus to the
 * tabbable element in `direction` from the guard. The guard before the trigger passes `-1`.
 *
 * @param store The popup's store.
 * @param event The guard's focus event.
 * @param direction Where to move focus from the guard.
 * @param positionerElement The popup's positioner, read before the close.
 * @param triggerElementRef The trigger, used as the anchor if the guard unmounted. Read after the
 *   close, as closing may re-render the trigger into a different element.
 */
function closeAndFocus(
  store: TriggerFocusGuardStore,
  event: React.FocusEvent<HTMLElement>,
  direction: 1 | -1,
  positionerElement: HTMLElement | null,
  triggerElementRef: React.RefObject<HTMLElement | null>,
) {
  const guard = event.currentTarget;

  ReactDOM.flushSync(() => {
    store.setOpen(false, createChangeEventDetails(REASONS.focusOut, event.nativeEvent, guard));
  });

  // The close callback may change the tab order. Resolve it after the flush, using the trigger as
  // the anchor if the guard unmounted, even when its tabIndex is -1.
  getTabbableNearElement(
    guard.isConnected ? guard : triggerElementRef.current,
    direction,
    positionerElement,
  )?.focus();
}

/**
 * Provides focus guard handlers for popup triggers (Popover, Menu).
 *
 * When the popup is open, invisible focus guard elements are placed before and after
 * the trigger. These handlers close the popup and move focus to the appropriate
 * tabbable element when the guards receive focus (i.e. when the user tabs out).
 * The guards' refs belong to the popup's `PopupDismissal`.
 */
export function useTriggerFocusGuards(
  store: TriggerFocusGuardStore,
  triggerElementRef: React.RefObject<HTMLElement | null>,
) {
  function handlePreFocusGuardFocus(event: React.FocusEvent<HTMLElement>) {
    closeAndFocus(store, event, -1, store.select('positionerElement'), triggerElementRef);
  }

  // Focusing the guard after the trigger moves focus into the popup when focus comes from outside
  // it, and otherwise (tabbing forward out of the popup) closes the popup.
  function handleFocusTargetFocus(event: React.FocusEvent<HTMLElement>) {
    const positionerElement = store.select('positionerElement');
    if (positionerElement && isOutsideEvent(event, positionerElement)) {
      getPopupDismissal(store).beforeContentFocusGuardRef.current?.focus();
    } else {
      closeAndFocus(store, event, 1, positionerElement, triggerElementRef);
    }
  }

  return { handlePreFocusGuardFocus, handleFocusTargetFocus };
}
