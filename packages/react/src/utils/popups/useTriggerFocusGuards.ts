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
 * the trigger. These handlers close the popup and move focus to the appropriate
 * tabbable element when the guards receive focus (i.e. when the user tabs out).
 */
export function useTriggerFocusGuards(
  store: TriggerFocusGuardStore,
  triggerElementRef: React.RefObject<HTMLElement | null>,
) {
  function closeAndFocus(
    event: React.FocusEvent<HTMLElement>,
    direction: 1 | -1,
    positionerElement: HTMLElement | null,
  ) {
    const guard = event.currentTarget;
    const trigger = triggerElementRef.current;

    // Without the content guard (a hover-opened popover), a guard reached from outside a tabbable
    // trigger means Tab is moving onto the trigger.
    if (
      !store.context.beforeContentFocusGuardRef.current &&
      isTabbable(trigger) &&
      !contains(trigger, event.relatedTarget as Element | null)
    ) {
      trigger?.focus();
      return;
    }

    ReactDOM.flushSync(() => {
      store.setOpen(false, createChangeEventDetails(REASONS.focusOut, event.nativeEvent, guard));
    });

    // The close callback may change the tab order. Resolve it after the flush, using
    // the trigger as the anchor if the guard unmounted, even when its tabIndex is -1.
    getTabbableNearElement(
      guard.isConnected ? guard : trigger,
      direction,
      positionerElement,
    )?.focus();
  }

  function handlePreFocusGuardFocus(event: React.FocusEvent<HTMLElement>) {
    closeAndFocus(event, -1, store.select('positionerElement'));
  }

  function handleFocusTargetFocus(event: React.FocusEvent<HTMLElement>) {
    const positionerElement = store.select('positionerElement');
    const contentFocusGuard = store.context.beforeContentFocusGuardRef.current;
    if (positionerElement && contentFocusGuard && isOutsideEvent(event, positionerElement)) {
      contentFocusGuard.focus();
    } else {
      closeAndFocus(event, 1, positionerElement);
    }
  }

  return { handlePreFocusGuardFocus, handleFocusTargetFocus };
}
