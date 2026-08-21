'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { ownerDocument } from '@base-ui/utils/owner';
import {
  activeElement,
  contains,
  type FocusableElement,
  getNextTabbable,
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
 * Invisible focus guard elements are placed before and after the trigger while the popup is
 * mounted. Focusing one while the popup is open closes it and forwards focus to the appropriate
 * tabbable element (i.e. the user tabbed out). Focusing a guard left over during the exit
 * animation only steers focus past it: the popup is already closed, so emitting another close
 * would fire `onOpenChange` twice and stamp `data-instant`, cancelling the exit transition.
 *
 * `Menu.Trigger` unmounts its guards as soon as the popup closes, so only `Popover.Trigger`
 * reaches the closed branches.
 */
export function useTriggerFocusGuards(
  store: TriggerFocusGuardStore,
  triggerElementRef: React.RefObject<HTMLElement | null>,
) {
  const preFocusGuardRef = React.useRef<HTMLElement>(null);

  // Moves focus to `element`, or releases it from the guard when there is nowhere to go. Without
  // the fallback, focus would be left sitting on an `aria-hidden` guard whenever the destination
  // is missing (nothing tabbable past the guard) or refuses focus (a disabled trigger).
  function focusOrRelease(
    element: FocusableElement | HTMLElement | null | undefined,
    guard: HTMLElement,
  ) {
    element?.focus();

    if (activeElement(ownerDocument(guard)) === guard) {
      guard.blur();
    }
  }

  // The first tabbable element after the trigger. An inert positioner is already excluded by
  // `tabbable()` itself, which rejects anything under an `inert` ancestor — the loop below only
  // covers a closing positioner that stays non-inert (a hover-opened popover). It does not
  // advance reliably, because `getNextTabbable` resolves its index from `activeElement` (the
  // guard) rather than from its argument; fixing that is a separate change.
  function tabbableAfterTrigger(positionerElement: HTMLElement | null, wrap: boolean) {
    let nextTabbable = getTabbableAfterElement(
      store.context.triggerFocusTargetRef.current || triggerElementRef.current,
      wrap,
    );

    while (nextTabbable !== null && contains(positionerElement, nextTabbable)) {
      const prevTabbable = nextTabbable;
      nextTabbable = getNextTabbable(nextTabbable);
      if (nextTabbable === prevTabbable) {
        break;
      }
    }

    return nextTabbable;
  }

  function handlePreFocusGuardFocus(event: React.FocusEvent) {
    const guard = event.currentTarget as HTMLElement;

    if (!store.select('open')) {
      // The popup is closed and only mounted for its exit animation, so this guard is a leftover
      // and must not re-close anything. Focus arriving from the trigger is still on its way out
      // backwards and should carry on past the guard; focus arriving from anywhere else is
      // tabbing forwards, and sending it back would bounce it to where it just came from.
      // Neither direction wraps: at the edge of the document focus is released rather than
      // looped around to the other end.
      if (event.relatedTarget === triggerElementRef.current) {
        focusOrRelease(getTabbableBeforeElement(preFocusGuardRef.current, false), guard);
      } else {
        focusOrRelease(triggerElementRef.current, guard);
      }
      return;
    }

    ReactDOM.flushSync(() => {
      store.setOpen(false, createChangeEventDetails(REASONS.focusOut, event.nativeEvent, guard));
    });

    const previousTabbable: FocusableElement | null = getTabbableBeforeElement(
      preFocusGuardRef.current,
    );
    previousTabbable?.focus();
  }

  function handleFocusTargetFocus(event: React.FocusEvent) {
    const positionerElement = store.select('positionerElement');
    const guard = event.currentTarget as HTMLElement;

    if (!store.select('open')) {
      // Mirror of the pre-guard: a leftover during the exit animation, which must not re-close
      // anything. Focus arriving from the trigger or from inside the popup is heading forwards
      // and carries on past the guard; focus arriving from after it is tabbing backwards.
      if (
        isOutsideEvent(event, positionerElement ?? guard) &&
        event.relatedTarget !== triggerElementRef.current
      ) {
        focusOrRelease(triggerElementRef.current, guard);
      } else {
        focusOrRelease(tabbableAfterTrigger(positionerElement, false), guard);
      }
      return;
    }

    if (positionerElement && isOutsideEvent(event, positionerElement)) {
      store.context.beforeContentFocusGuardRef.current?.focus();
      return;
    }

    ReactDOM.flushSync(() => {
      store.setOpen(false, createChangeEventDetails(REASONS.focusOut, event.nativeEvent, guard));
    });

    tabbableAfterTrigger(positionerElement, true)?.focus();
  }

  return { preFocusGuardRef, handlePreFocusGuardFocus, handleFocusTargetFocus };
}
