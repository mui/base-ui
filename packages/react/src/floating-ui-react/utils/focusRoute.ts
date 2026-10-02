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

// The other places focus can go.
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

/**
 * The guard rendered in each slot. Every guard registers here, so the route knows which guards
 * exist and which elements are its own.
 */
export type FocusRoute = React.RefObject<HTMLElement | null>[];

export interface FocusRouteFacts {
  slot: FocusRouteSlot;
  /** Where focus came from: the content (including its guards), the trigger, or elsewhere. */
  from: 'content' | 'trigger' | 'outside';
  open: boolean;
  /** Whether the focus manager traps focus in the content. */
  modal: boolean;
  /** Whether the content guards are rendered, that is, whether the focus manager is active. */
  contentGuards: boolean;
  /** Whether the trigger guards are rendered. */
  triggerGuards: boolean;
  /**
   * Whether the content follows its trigger in the tab order (Popover, Menu) rather than the
   * portal placeholder.
   */
  followsTrigger: boolean;
  closeOnFocusOut: boolean;
}

/** Where focus goes, and whether leaving closes the popup. */
export type FocusRouteDecision = [target: FocusRouteTarget, close?: boolean];

/**
 * The routing table. The trigger and portal guards hand focus into the content only while the popup
 * is open, and only an open popup closes.
 */
export function getFocusRouteDecision(facts: FocusRouteFacts): FocusRouteDecision {
  const { slot, from, open, contentGuards } = facts;
  const fromContent = from === 'content';

  switch (slot) {
    case BEFORE_TRIGGER:
      // Tab from before the trigger continues to it; Shift+Tab from the trigger leaves.
      return from === 'outside' ? [TRIGGER] : [BACKWARD, open];
    case AFTER_TRIGGER:
      // Shift+Tab from after the trigger, with no portal guards in between, reaches it.
      if (from === 'outside') {
        return [TRIGGER];
      }
      // Tab from the trigger enters the content if the focus manager can take it from there.
      return from === 'trigger' && open && contentGuards ? [BEFORE_CONTENT] : [FORWARD, open];
    case BEFORE_PORTAL:
      // The content sits at the placeholder: Tab enters it, Shift+Tab out of it continues before.
      if (fromContent) {
        return [BACKWARD];
      }
      return [open && contentGuards ? BEFORE_CONTENT : FORWARD];
    case AFTER_PORTAL:
      if (fromContent) {
        return [FORWARD, open && facts.closeOnFocusOut];
      }
      return [open && contentGuards ? AFTER_CONTENT : BACKWARD];
    case BEFORE_CONTENT:
      if (facts.modal) {
        return [LAST];
      }
      // Shift+Tab out of the content returns to the trigger it follows, or to the placeholder.
      if (fromContent) {
        return [facts.followsTrigger ? TRIGGER : BEFORE_PORTAL];
      }
      return [NEXT];
    default:
      if (facts.modal) {
        return [FIRST];
      }
      // Tab out of the content leaves past the trigger if it has guards, else past the placeholder.
      if (fromContent) {
        return [facts.triggerGuards ? AFTER_TRIGGER : AFTER_PORTAL];
      }
      return [PREVIOUS];
  }
}

const routes = new WeakMap<FloatingRootStore, FocusRoute>();

/**
 * Returns the route of the popup that owns `store`. The trigger and the focus manager share the
 * root store; the focus manager hands the route to its portal.
 */
export function getFocusRoute(store: FloatingRootStore): FocusRoute {
  let route = routes.get(store);
  if (!route) {
    route = Array.from({ length: 6 }, () => ({ current: null }));
    routes.set(store, route);
  }
  return route;
}

export interface FocusRouteOptions {
  /** The popup's subtree: the portal node if known. Defaults to the floating element. */
  container?: Element | null | undefined;
  modal?: boolean | undefined;
  followsTrigger?: boolean | undefined;
  closeOnFocusOut?: boolean | undefined;
}

/**
 * Moves focus that reached one of the route's guards. Each guard's owner passes the facts it owns.
 */
export function focusRoute(
  store: FloatingRootStore,
  event: React.FocusEvent<HTMLElement>,
  options: FocusRouteOptions = {},
) {
  const route = getFocusRoute(store);
  const guard = event.currentTarget;
  const relatedTarget = event.relatedTarget as Element | null;
  const trigger = store.state.domReferenceElement as FocusableElement | null;
  const container = options.container ?? store.state.floatingElement;
  const slot = route.findIndex((ref) => ref.current === guard) as FocusRouteSlot;
  const atTrigger = slot <= AFTER_TRIGGER;

  let from: FocusRouteFacts['from'] = 'outside';
  if (contains(container, relatedTarget)) {
    from = 'content';
  } else if (contains(trigger, relatedTarget)) {
    from = 'trigger';
  }

  const [target, close] = getFocusRouteDecision({
    slot,
    from,
    open: store.state.open,
    modal: !!options.modal,
    contentGuards: !!route[BEFORE_CONTENT].current,
    triggerGuards: !!route[AFTER_TRIGGER].current,
    followsTrigger: !!options.followsTrigger && !!trigger,
    closeOnFocusOut: options.closeOnFocusOut !== false,
  });

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
  }

  let element: FocusableElement | null | undefined;
  if (target === TRIGGER) {
    element = trigger;
  } else if (target === NEXT || target === PREVIOUS) {
    element = getTabbableNearElement(guard, target === NEXT ? 1 : -1);
  } else if (target === FORWARD || target === BACKWARD) {
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
  } else if (target === FIRST || target === LAST) {
    const focusElement = getFloatingFocusElement(store.state.floatingElement);
    const content = focusElement ? tabbable(focusElement) : [];
    // enqueueFocus returns a rAF-cancel function we don't need here.
    void enqueueFocus(content[target === FIRST ? 0 : content.length - 1]);
  } else {
    element = route[target].current;
  }
  element?.focus();

  // A portal guard is unmounted by the close itself, so it moves focus first.
  if (close && !atTrigger) {
    requestClose();
  }
}
