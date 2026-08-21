'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { ownerDocument } from '@base-ui/utils/owner';
import {
  activeElement,
  contains,
  type FocusableElement,
  getTabbableAfterElement,
  getTabbableBeforeElement,
  isOutsideEvent,
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
  select(key: 'open'): boolean;
  context: {
    readonly beforeContentFocusGuardRef: React.RefObject<HTMLElement | null>;
    readonly triggerFocusTargetRef: React.RefObject<HTMLElement | null>;
  };
}

/**
 * Provides focus guard handlers for popup triggers (Popover, Menu).
 *
 * Invisible focus guard elements are placed before and after the trigger while the popup is open.
 * These handlers close the popup and move focus to the appropriate tabbable element when a guard
 * receives focus (i.e. when the user tabs out). Popover keeps the guards connected but removes
 * them from sequential navigation during an exit animation so an already-dispatched native focus
 * event can still be completed without exposing the guards to subsequent Tab navigation.
 */
export function useTriggerFocusGuards(
  store: TriggerFocusGuardStore,
  triggerElementRef: React.RefObject<HTMLElement | null>,
) {
  const preFocusGuardRef = React.useRef<HTMLElement>(null);

  function focusOrRelease(
    element: FocusableElement | HTMLElement | null | undefined,
    guard: HTMLElement,
  ) {
    element?.focus();

    // At a document boundary there is no destination. Do not leave focus on the invisible guard.
    if (activeElement(ownerDocument(guard)) === guard) {
      guard.blur();
    }
  }

  function handlePreFocusGuardFocus(event: React.FocusEvent) {
    const guard = event.currentTarget as HTMLElement;

    // Focus can already be moving to this guard when focusout closes the popup. The guard remains
    // connected for that event but is no longer tabbable; finish the pending backward move without
    // emitting a second close.
    if (!store.select('open')) {
      focusOrRelease(getTabbableBeforeElement(triggerElementRef.current, false), guard);
      return;
    }

    const previousTabbable = getTabbableBeforeElement(preFocusGuardRef.current, false);

    ReactDOM.flushSync(() => {
      store.setOpen(false, createChangeEventDetails(REASONS.focusOut, event.nativeEvent, guard));
    });

    // Popover keeps this guard connected but removes it from sequential navigation at close;
    // Menu unmounts it. Resolve the previous element before either update happens.
    focusOrRelease(previousTabbable, guard);
  }

  function getTabbableAfterTrigger(positionerElement: HTMLElement | null) {
    let nextTabbable: FocusableElement | null = getTabbableAfterElement(
      triggerElementRef.current,
      false,
    );

    // A non-inert closing popup remains in the DOM for its exit animation. Skip all of its
    // descendants without wrapping back to the start of the document.
    while (nextTabbable !== null && contains(positionerElement, nextTabbable)) {
      nextTabbable = getTabbableAfterElement(nextTabbable, false);
    }

    return nextTabbable;
  }

  function handleFocusTargetFocus(event: React.FocusEvent) {
    const positionerElement = store.select('positionerElement');
    const guard = event.currentTarget as HTMLElement;

    // Mirror the pre-guard case for a forward move that was already in flight when focusout closed
    // the popup. Subsequent Tab navigation skips this guard because its tabIndex is now -1.
    if (!store.select('open')) {
      focusOrRelease(getTabbableAfterTrigger(positionerElement), guard);
      return;
    }

    if (positionerElement && isOutsideEvent(event, positionerElement)) {
      store.context.beforeContentFocusGuardRef.current?.focus();
      return;
    }

    ReactDOM.flushSync(() => {
      store.setOpen(false, createChangeEventDetails(REASONS.focusOut, event.nativeEvent, guard));
    });

    focusOrRelease(getTabbableAfterTrigger(positionerElement), guard);
  }

  return { preFocusGuardRef, handlePreFocusGuardFocus, handleFocusTargetFocus };
}
