'use client';
import type * as React from 'react';
import * as ReactDOM from 'react-dom';
import {
  contains,
  getTabbableNearElement,
  isOutsideEvent,
  isTabbable,
} from '../../floating-ui-react/utils';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import type { BaseUIChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';

/**
 * Minimal store interface required by the focus guard hook.
 * Both PopoverStore and MenuStore satisfy this interface.
 */
interface TriggerFocusGuardStore {
  setOpen(open: boolean, eventDetails: BaseUIChangeEventDetails<typeof REASONS.focusOut>): void;
  select(key: 'positionerElement'): HTMLElement | null;
  context: {
    /**
     * Shared with the focus manager through `getInsideElements` so that blurring the trigger
     * onto this guard does not close the popup before the guard's own focus handler runs.
     */
    readonly beforeTriggerFocusGuardRef: React.RefObject<HTMLElement | null>;
    readonly beforeContentFocusGuardRef: React.RefObject<HTMLElement | null>;
    readonly triggerFocusTargetRef: React.RefObject<HTMLElement | null>;
  };
}

/**
 * Provides focus guard handlers for popup triggers (Popover, Menu).
 *
 * When the popup is open, invisible focus guard elements are placed before and after
 * the trigger. When a guard receives focus, these handlers move focus into the popup or onto the
 * trigger, or close the popup and move focus past the trigger (i.e. when the user tabs out).
 */
export function useTriggerFocusGuards(
  store: TriggerFocusGuardStore,
  triggerElementRef: React.RefObject<HTMLElement | null>,
) {
  function handleGuardFocus(event: React.FocusEvent<HTMLElement>, direction: 1 | -1) {
    const guard = event.currentTarget;
    const trigger = triggerElementRef.current;
    const positionerElement = store.select('positionerElement');
    const contentFocusGuard = store.context.beforeContentFocusGuardRef.current;
    const fromOutside = !contains(trigger, event.relatedTarget);

    // The guard after the trigger leads into the popup through its content guard. Without one
    // (a hover-opened popover), Tab from outside moves onto the trigger, or past it if untabbable.
    const redirectTarget = contentFocusGuard
      ? direction === 1 &&
        positionerElement &&
        isOutsideEvent(event, positionerElement) &&
        contentFocusGuard
      : fromOutside && isTabbable(trigger) && trigger;

    if (redirectTarget) {
      redirectTarget.focus();
      return;
    }

    ReactDOM.flushSync(() => {
      store.setOpen(false, createChangeEventDetails(REASONS.focusOut, event.nativeEvent, guard));
    });

    // The close callback may change the tab order. Resolve it after the flush, using
    // the trigger as the anchor if the guard unmounted, even when its tabIndex is -1.
    // A canceled close keeps the guard, so focus goes back the way it came.
    getTabbableNearElement(
      guard.isConnected ? guard : triggerElementRef.current,
      (contentFocusGuard || !fromOutside || guard.isConnected ? direction : -direction) as 1 | -1,
      positionerElement,
    )?.focus();
  }

  return {
    handlePreFocusGuardFocus: (event: React.FocusEvent<HTMLElement>) => handleGuardFocus(event, -1),
    handleFocusTargetFocus: (event: React.FocusEvent<HTMLElement>) => handleGuardFocus(event, 1),
  };
}
