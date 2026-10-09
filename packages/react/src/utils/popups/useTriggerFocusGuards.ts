'use client';
import type * as React from 'react';
import type { BaseUIChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import type { REASONS } from '../../internals/reasons';
import type { FloatingRootContextValues } from './floating-root/types';
import { getPopupDismissal } from './interactions/popupDismissal';

/**
 * Minimal store interface required by the focus guard hook.
 * Both PopoverStore and MenuStore satisfy this interface.
 */
interface TriggerFocusGuardStore {
  setOpen(open: boolean, eventDetails: BaseUIChangeEventDetails<typeof REASONS.focusOut>): void;
  select(key: 'positionerElement'): HTMLElement | null;
  context: FloatingRootContextValues;
}

/**
 * Provides focus guard handlers for popup triggers (Popover, Menu).
 *
 * When the popup is open, invisible focus guard elements are placed before and after
 * the trigger. These handlers close the popup and move focus to the appropriate
 * tabbable element when the guards receive focus (i.e. when the user tabs out).
 * The rules and the guards' refs belong to the popup's `PopupDismissal`.
 */
export function useTriggerFocusGuards(
  store: TriggerFocusGuardStore,
  triggerElementRef: React.RefObject<HTMLElement | null>,
) {
  const dismissal = getPopupDismissal(store);

  function handlePreFocusGuardFocus(event: React.FocusEvent<HTMLElement>) {
    dismissal.handleBeforeTriggerGuardFocus(
      event,
      store.select('positionerElement'),
      triggerElementRef,
    );
  }

  function handleFocusTargetFocus(event: React.FocusEvent<HTMLElement>) {
    dismissal.handleTriggerFocusTargetFocus(
      event,
      store.select('positionerElement'),
      triggerElementRef,
    );
  }

  return { handlePreFocusGuardFocus, handleFocusTargetFocus };
}
