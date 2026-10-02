'use client';
import type * as React from 'react';
import * as ReactDOM from 'react-dom';
import { contains, getFloatingFocusElement } from './element';
import { enqueueFocus } from './enqueueFocus';
import { getTabbableNearElement, tabbable } from './tabbable';
import type { FocusableElement } from './tabbable';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import type { FloatingRootStore } from '../components/FloatingRootStore';

// The slots of a popup's sequential focus route, in tab order. The trigger renders its guards
// around itself, `FloatingPortal` around its placeholder, and `FloatingFocusManager` around the
// content.
export const BEFORE_TRIGGER = 0;
export const AFTER_TRIGGER = 1;
export const BEFORE_PORTAL = 2;
export const AFTER_PORTAL = 3;
export const BEFORE_CONTENT = 4;
export const AFTER_CONTENT = 5;

// The other places focus can go, numbered after the slots in forward/backward pairs. `focusRoute`
// relies on this order.
/** The trigger. */
export const TRIGGER = 6;
/** The tabbable element after (or before) the guard: into the content. */
export const NEXT = 7;
export const PREVIOUS = 8;
/** The tabbable element after (or before) the popup: out of the route. */
export const FORWARD = 9;
export const BACKWARD = 10;
/** The first (or last) tabbable element of the content: a modal wrap. */
export const FIRST = 11;
export const LAST = 12;

export type FocusRouteSlot = 0 | 1 | 2 | 3 | 4 | 5;
export type FocusRouteTarget = FocusRouteSlot | 6 | 7 | 8 | 9 | 10 | 11 | 12;

// Where focus came from: elsewhere, the trigger, or the content (including its guards).
export const FROM_OUTSIDE = 0;
export const FROM_TRIGGER = 1;
export const FROM_CONTENT = 2;

export type FocusRouteOrigin = 0 | 1 | 2;

/**
 * The guard rendered in each slot. Every guard registers here, so the route knows which guards
 * exist and which elements are its own.
 */
export type FocusRoute = React.RefObject<HTMLElement | null>[];

/** Where focus goes, and whether leaving closes the popup. */
export type FocusRouteDecision = [target: FocusRouteTarget, close?: boolean];

/**
 * The routing table. The trigger and portal guards hand focus into the content only while the popup
 * is open, and only an open popup closes. The facts are positional to keep the call cheap.
 *
 * @param slot The guard that focus reached.
 * @param from Where focus came from.
 * @param open Whether the popup is open.
 * @param modal Whether the focus manager traps focus in the content.
 * @param contentGuards Whether the content guards are rendered, that is, whether the focus manager
 *   is active.
 * @param triggerGuards Whether the trigger guards are rendered.
 * @param followsTrigger Whether the content follows its trigger in the tab order (Popover, Menu)
 *   rather than the portal placeholder.
 * @param closeOnFocusOut Whether leaving the content through the portal closes the popup.
 */
export function getFocusRouteDecision(
  slot: FocusRouteSlot,
  from: FocusRouteOrigin,
  open: boolean,
  modal: boolean,
  contentGuards: boolean,
  triggerGuards: boolean,
  followsTrigger: boolean,
  closeOnFocusOut: boolean,
): FocusRouteDecision {
  const fromContent = from === FROM_CONTENT;

  switch (slot) {
    case BEFORE_TRIGGER:
      // Tab from before the trigger continues to it; Shift+Tab from the trigger leaves.
      return from === FROM_OUTSIDE ? [TRIGGER] : [BACKWARD, open];
    case AFTER_TRIGGER:
      // Shift+Tab from after the trigger, with no portal guards in between, reaches it.
      if (from === FROM_OUTSIDE) {
        return [TRIGGER];
      }
      // Tab from the trigger enters the content if the focus manager can take it from there.
      return from === FROM_TRIGGER && open && contentGuards ? [BEFORE_CONTENT] : [FORWARD, open];
    case BEFORE_PORTAL:
      // The content sits at the placeholder: Tab enters it, Shift+Tab out of it continues before.
      if (fromContent) {
        return [BACKWARD];
      }
      return [open && contentGuards ? BEFORE_CONTENT : FORWARD];
    case AFTER_PORTAL:
      if (fromContent) {
        return [FORWARD, open && closeOnFocusOut];
      }
      return [open && contentGuards ? AFTER_CONTENT : BACKWARD];
    case BEFORE_CONTENT:
      if (modal) {
        return [LAST];
      }
      // Shift+Tab out of the content returns to the trigger it follows, or to the placeholder.
      if (fromContent) {
        return [followsTrigger ? TRIGGER : BEFORE_PORTAL];
      }
      return [NEXT];
    default:
      if (modal) {
        return [FIRST];
      }
      // Tab out of the content leaves past the trigger if it has guards, else past the placeholder.
      if (fromContent) {
        return [triggerGuards ? AFTER_TRIGGER : AFTER_PORTAL];
      }
      return [PREVIOUS];
  }
}

/**
 * Returns the route of the popup that owns `store`. The trigger and the focus manager share the
 * root store; the focus manager hands the route to its portal.
 */
export function getFocusRoute(store: FloatingRootStore): FocusRoute {
  store.focusRoute ??= Array.from({ length: 6 }, () => ({ current: null }));
  return store.focusRoute;
}

/**
 * Moves focus that reached one of the route's guards. Each guard's owner passes the facts it owns:
 * a trigger passes none, and the focus manager passes the rest, which apply to the content and
 * portal guards.
 *
 * @param container The popup's subtree: the portal node if known. Defaults to the floating
 *   element.
 * @param modal Whether the focus manager traps focus in the content.
 * @param followsTrigger Whether the content follows its trigger in the tab order.
 * @param closeOnFocusOut Whether leaving the content through the portal closes the popup.
 */
export function focusRoute(
  store: FloatingRootStore,
  event: React.FocusEvent<HTMLElement>,
  container?: Element | null,
  modal?: boolean,
  followsTrigger?: boolean,
  closeOnFocusOut?: boolean,
) {
  const route = getFocusRoute(store);
  const guard = event.currentTarget;
  const relatedTarget = event.relatedTarget as Element | null;
  // The floating root keeps a removed trigger as its reference, and a consumer may replace the
  // trigger's element when the popup closes, so only a trigger in the document counts.
  const getTrigger = () => {
    const reference = store.state.domReferenceElement as FocusableElement | null;
    return reference?.isConnected ? reference : null;
  };
  let trigger = getTrigger();
  container ??= store.state.floatingElement;
  const slot = route.findIndex((ref) => ref.current === guard) as FocusRouteSlot;
  const atTrigger = slot <= AFTER_TRIGGER;

  let from: FocusRouteOrigin = FROM_OUTSIDE;
  if (contains(container, relatedTarget)) {
    from = FROM_CONTENT;
  } else if (contains(trigger, relatedTarget)) {
    from = FROM_TRIGGER;
  }

  const [target, close] = getFocusRouteDecision(
    slot,
    from,
    store.state.open,
    !!modal,
    !!route[BEFORE_CONTENT].current,
    !!route[AFTER_TRIGGER].current,
    !!followsTrigger && !!trigger,
    closeOnFocusOut !== false,
  );

  function requestClose() {
    store.setOpen(
      false,
      createChangeEventDetails(REASONS.focusOut, event.nativeEvent, atTrigger ? guard : undefined),
    );
  }

  // Closing unmounts the trigger's and the portal's guards, and the consumer may change the page,
  // so a trigger guard looks for the destination once the close has committed.
  if (close && atTrigger) {
    ReactDOM.flushSync(requestClose);
    if (!trigger?.isConnected) {
      trigger = getTrigger();
    }
  }

  let element: FocusableElement | null | undefined;
  if (target < TRIGGER) {
    element = route[target].current;
  } else if (target === TRIGGER) {
    element = trigger;
  } else if (target < FORWARD) {
    element = getTabbableNearElement(guard, target === NEXT ? 1 : -1);
  } else if (target < FIRST) {
    // Continue from the guard, or from the trigger if the close unmounted the guard, skipping the
    // popup and the rest of the route. At the end of the document, a trigger guard wraps around
    // like the browser's tab cycle, and a portal guard goes back to the trigger.
    element =
      getTabbableNearElement(
        guard.isConnected ? guard : trigger,
        target === FORWARD ? 1 : -1,
        [container, ...route.map((ref) => ref.current)],
        atTrigger,
      ) ?? trigger;
  } else {
    const focusElement = getFloatingFocusElement(store.state.floatingElement);
    const content = focusElement ? tabbable(focusElement) : [];
    // enqueueFocus returns a rAF-cancel function we don't need here.
    void enqueueFocus(content[target === FIRST ? 0 : content.length - 1]);
  }
  element?.focus();

  // A portal guard is unmounted by the close itself, so it moves focus first.
  if (close && !atTrigger) {
    requestClose();
  }
}
