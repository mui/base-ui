'use client';
import type * as React from 'react';
import * as ReactDOM from 'react-dom';
import { ownerDocument } from '@base-ui/utils/owner';
import { contains, isOutsideEvent, tabbable } from '../../floating-ui-react/utils';
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
  // Share the guard with the focus manager so trigger blur does not close before its focus handler.
  const preFocusGuardRef = store.context.beforeTriggerFocusGuardRef;

  function closeAndFocus(event: React.FocusEvent<HTMLElement>, direction: 1 | -1) {
    const guard = event.currentTarget;
    const positionerElement = store.select('positionerElement');
    // Keep the guard's place in the tab order before closing unmounts it. The trigger
    // may have tabIndex=-1 and therefore cannot serve as the navigation anchor.
    const elements = tabbable(ownerDocument(guard).body);
    const index = elements.indexOf(guard);

    ReactDOM.flushSync(() => {
      store.setOpen(false, createChangeEventDetails(REASONS.focusOut, event.nativeEvent, guard));
    });

    // Skip removed guards and closing content, but preserve an enclosing popup's guards.
    for (let offset = 1; offset < elements.length; offset += 1) {
      const element = elements[(index + direction * offset + elements.length) % elements.length];
      if (
        element.isConnected &&
        !contains(positionerElement, element) &&
        element !== preFocusGuardRef.current &&
        element !== store.context.triggerFocusTargetRef.current
      ) {
        element.focus();
        return;
      }
    }

    triggerElementRef.current?.focus();
  }

  function handlePreFocusGuardFocus(event: React.FocusEvent<HTMLElement>) {
    closeAndFocus(event, -1);
  }

  function handleFocusTargetFocus(event: React.FocusEvent<HTMLElement>) {
    const positionerElement = store.select('positionerElement');
    if (positionerElement && isOutsideEvent(event, positionerElement)) {
      store.context.beforeContentFocusGuardRef.current?.focus();
    } else {
      closeAndFocus(event, 1);
    }
  }

  return { preFocusGuardRef, handlePreFocusGuardFocus, handleFocusTargetFocus };
}
