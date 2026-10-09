import type * as React from 'react';
import { getNodeName, isHTMLElement } from '@floating-ui/utils/dom';
import type { InteractionType } from '@base-ui/utils/useEnhancedClickHandler';
import { ownerWindow } from '@base-ui/utils/owner';
import { getTarget } from '@base-ui/utils/shadowDom';
import type { FloatingRootContext, FloatingRootContextValues } from '../floating-root/types';
import type { FloatingUIOpenChangeDetails } from '../../../internals/types';
import { REASONS } from '../../../internals/reasons';
import { createAttribute } from '../createAttribute';
import { isVirtualClick, isVirtualPointerEvent } from '../event';
import { resolveRef } from '../../resolveRef';

/**
 * When an outside press dismisses a popup.
 * - `'intentional'`: on the `click`, once the press has ended.
 * - `'sloppy'`: as soon as a mouse press starts (`pointerdown`). For touch, on a tap's compatibility
 *   `mousedown`, or on `touchend` or `touchmove` once the finger has moved.
 */
export type OutsidePressType = 'intentional' | 'sloppy';

/**
 * The outside press timing of a popup that can trap focus. A trap-focus popup is dismissed as soon
 * as a mouse press starts outside it, so `aria-hidden` on the outside content is removed before
 * focus lands there. A backdrop catches the press instead, so a popup with one waits for the click.
 *
 * @param modal The popup's `modal` prop.
 * @param hasBackdrop Whether a backdrop is rendered behind the popup.
 */
export function getModalOutsidePressEvent(
  modal: boolean | 'trap-focus',
  hasBackdrop = false,
): OutsidePressType | { mouse: OutsidePressType; touch: OutsidePressType } {
  if (hasBackdrop) {
    return 'intentional';
  }
  return {
    mouse: modal === 'trap-focus' ? 'sloppy' : 'intentional',
    touch: 'sloppy',
  };
}

/**
 * Press, touch and composition state of one `useDismiss` instance.
 */
export interface DismissSession {
  /**
   * Whether the current primary press started inside the floating element.
   */
  pressStartedInside: boolean;
  /**
   * Whether the inside press start was default-prevented.
   */
  pressStartPrevented: boolean;
  /**
   * Ignores only the very next outside click after dragging from inside to outside.
   */
  suppressNextOutsideClick: boolean;
  /**
   * Whether a press began while the popup was open. A click whose press began before it opened is
   * the tail of that gesture (e.g. the drag-release that opened it), not a new outside press.
   */
  sawPressWhileOpen: boolean;
  /**
   * Whether an IME composition is in progress.
   */
  isComposing: boolean;
  /**
   * The pointer type of the last press.
   */
  currentPointerType: PointerEvent['pointerType'];
  /**
   * The touch being tracked for a sloppy outside press, if any.
   */
  touchState: {
    startTime: number;
    startX: number;
    startY: number;
    dismissOnTouchEnd: boolean;
    dismissOnMouseDown: boolean;
  } | null;
}

/**
 * Interaction and return focus state of one focus manager instance.
 */
export interface FocusReturnSession {
  /**
   * Whether the next return focus is suppressed.
   */
  preventReturnFocus: boolean;
  /**
   * Whether the current press started outside the popup and its trigger.
   */
  pointerDownOutside: boolean;
  /**
   * The type of the last pointer or keyboard interaction.
   */
  lastInteractionType: InteractionType;
  /**
   * The type of the interaction that closed the popup.
   */
  closeType: InteractionType;
  /**
   * A return focus queued when the focus manager's effect was cleaned up. It is cancelled if the
   * effect re-arms in the same commit, as a cleanup caused by a dependency changing while open
   * (such as the trigger) is not a close.
   */
  pendingReturnFocus: { cancelled: boolean } | null;
}

type OpenChangeListener = (details: FloatingUIOpenChangeDetails) => void;

/**
 * The dismissal and focus return state of one popup. Shared by its `useDismiss` (on the Root) and
 * its focus manager (on the Popup), which stay thin adapters that attach their listeners at the
 * right times.
 */
export class PopupDismissal {
  private insideReactTree = false;

  private readonly openChangeListeners = new Set<OpenChangeListener>();

  constructor(private readonly store: Pick<FloatingRootContext, 'context'>) {}

  /**
   * Whether the current press or focus change started inside the popup's React tree, including its
   * portaled children. Set by the popup's capture handlers and cleared on the next tick.
   */
  isInsideReactTree() {
    return this.insideReactTree;
  }

  setInsideReactTree(value: boolean) {
    this.insideReactTree = value;
  }

  /**
   * Creates the state of one `useDismiss` instance.
   */
  createDismissSession(): DismissSession {
    return {
      pressStartedInside: false,
      pressStartPrevented: false,
      suppressNextOutsideClick: false,
      sawPressWhileOpen: false,
      isComposing: false,
      currentPointerType: '',
      touchState: null,
    };
  }

  /**
   * Creates the state of one focus manager instance.
   */
  createFocusReturnSession(): FocusReturnSession {
    return {
      preventReturnFocus: false,
      pointerDownOutside: false,
      lastInteractionType: '',
      closeType: '',
      pendingReturnFocus: null,
    };
  }

  /**
   * Listens to the popup's accepted open changes. The popup's emitter has a single subscriber,
   * which calls the listeners in the order they subscribed.
   *
   * @returns A function that removes the listener.
   */
  onOpenChange(listener: OpenChangeListener) {
    const { events } = this.store.context;
    if (this.openChangeListeners.size === 0) {
      events.on('openchange', this.handleOpenChange);
    }
    this.openChangeListeners.add(listener);

    return () => {
      this.openChangeListeners.delete(listener);
      if (this.openChangeListeners.size === 0) {
        events.off('openchange', this.handleOpenChange);
      }
    };
  }

  private handleOpenChange = (details: FloatingUIOpenChangeDetails) => {
    this.openChangeListeners.forEach((listener) => listener(details));
  };
}

const dismissals = new WeakMap<FloatingRootContextValues, PopupDismissal>();

/**
 * Returns the popup's `PopupDismissal`, creating it on first use.
 */
export function getPopupDismissal(store: Pick<FloatingRootContext, 'context'>): PopupDismissal {
  let dismissal = dismissals.get(store.context);
  if (!dismissal) {
    dismissal = new PopupDismissal(store);
    dismissals.set(store.context, dismissal);
  }
  return dismissal;
}

/**
 * Dismissal rule: an accepted close ends the press session, so a press that began while the popup
 * was open no longer counts.
 */
export function endPressSessionOnClose(
  session: DismissSession,
  details: FloatingUIOpenChangeDetails,
) {
  // Only the closing half ends the session: `setOpen(true)` on an already-open element (hovering
  // an inactive trigger) must not drop a press mid-gesture.
  if (!details.open) {
    session.sawPressWhileOpen = false;
  }
}

/**
 * Returns the type of interaction an event came from.
 */
export function getInteractionType(
  event: Event,
  lastInteractionType?: InteractionType,
): InteractionType {
  const win = ownerWindow(getTarget(event));
  if (event instanceof win.KeyboardEvent) {
    return 'keyboard';
  }
  if (event instanceof win.FocusEvent) {
    // Focus events can be caused by a preceding pointer interaction (e.g., focusout on outside press).
    // Prefer the last known pointer type if provided, else treat as keyboard.
    return lastInteractionType || 'keyboard';
  }
  if ('pointerType' in event) {
    // A trusted click without a pointerType is keyboard/AT; only synthesized
    // clicks (e.g. a test harness) pair an empty pointerType with a click count.
    return (
      (event.pointerType as InteractionType) ||
      (isVirtualClick(event as PointerEvent) ? 'keyboard' : lastInteractionType || 'mouse')
    );
  }
  if ('touches' in event) {
    return 'touch';
  }
  if (event instanceof win.MouseEvent) {
    // onClick events may not contain pointer events, and will fall through to here
    return lastInteractionType || (event.detail === 0 ? 'keyboard' : 'mouse');
  }
  return '';
}

/**
 * Whether the browser supports the `focus({ preventScroll })` option.
 */
export function isPreventScrollSupported(doc: Document) {
  let supported = false;
  doc.createElement('div').focus({
    get preventScroll() {
      supported = true;
      return false;
    },
  });
  return supported;
}

/**
 * Return focus rule: records how an accepted open change affects the next return focus.
 *
 * - A close records the type of interaction that closed the popup.
 * - A close by a focus guard, which moves focus itself, or by the pointer leaving a hover-opened
 *   popup suppresses the return.
 * - An outside press returns focus for nested popups and virtual clicks. Otherwise it returns
 *   focus only when the browser supports `preventScroll`, as restoring focus would scroll the page.
 *
 * @param session The focus manager's state.
 * @param details The accepted open change.
 * @param doc The popup's document, to detect `preventScroll` support.
 */
export function recordCloseForReturnFocus(
  session: FocusReturnSession,
  details: FloatingUIOpenChangeDetails,
  doc: Document,
) {
  if (!details.open) {
    session.closeType = getInteractionType(details.nativeEvent, session.lastInteractionType);
  }

  if (
    (details.reason === REASONS.focusOut &&
      details.triggerElement?.hasAttribute(createAttribute('focus-guard'))) ||
    (details.reason === REASONS.triggerHover && details.nativeEvent.type === 'mouseleave')
  ) {
    session.preventReturnFocus = true;
  }

  if (details.reason !== REASONS.outsidePress) {
    return;
  }

  if (details.nested) {
    session.preventReturnFocus = false;
  } else if (
    isVirtualClick(details.nativeEvent as MouseEvent) ||
    isVirtualPointerEvent(details.nativeEvent as PointerEvent)
  ) {
    session.preventReturnFocus = false;
  } else {
    // Chrome on Android and Samsung Internet still don't support `preventScroll`
    // (https://issues.chromium.org/issues/41453122), so return focus stays disabled there to avoid
    // the scroll jump.
    session.preventReturnFocus = !isPreventScrollSupported(doc);
  }
}

/**
 * The `returnFocus` option of a focus manager.
 */
export type ReturnFocusOption =
  | boolean
  | React.RefObject<HTMLElement | null>
  | ((closeType: InteractionType) => boolean | HTMLElement | null | void)
  | undefined;

/**
 * Return focus rule: resolves the element focus returns to.
 *
 * The default is the last trigger, or the element focused before the popup opened when the popup
 * was opened programmatically (or the trigger is gone), then the most recently focused element on
 * the page.
 *
 * @returns The element, or `null` when focus should not return.
 */
export function resolveReturnFocusElement(parameters: {
  returnFocus: ReturnFocusOption;
  closeType: InteractionType;
  lastTrigger: Element | null;
  elementFocusedBeforeOpen: Element | null;
  preferPreviousFocus: boolean;
  getPreviouslyFocusedElement: () => Element | null | undefined;
}): Element | null {
  const {
    returnFocus,
    closeType,
    lastTrigger,
    elementFocusedBeforeOpen,
    preferPreviousFocus,
    getPreviouslyFocusedElement,
  } = parameters;

  let resolvedReturnFocusValue =
    typeof returnFocus === 'function' ? returnFocus(closeType) : returnFocus;

  // `null` should fallback to default behavior in case of an empty ref.
  if (resolvedReturnFocusValue === undefined || resolvedReturnFocusValue === false) {
    return null;
  }

  if (resolvedReturnFocusValue === null) {
    resolvedReturnFocusValue = true;
  }

  const referenceReturnElement = lastTrigger?.isConnected ? lastTrigger : null;
  const previousReturnElement =
    elementFocusedBeforeOpen?.isConnected && getNodeName(elementFocusedBeforeOpen) !== 'body'
      ? elementFocusedBeforeOpen
      : null;

  let defaultReturnElement = preferPreviousFocus
    ? previousReturnElement || referenceReturnElement
    : referenceReturnElement || previousReturnElement;

  if (!defaultReturnElement) {
    defaultReturnElement = getPreviouslyFocusedElement() || null;
  }

  if (typeof resolvedReturnFocusValue === 'boolean') {
    return defaultReturnElement;
  }

  return resolveRef(resolvedReturnFocusValue) || defaultReturnElement || null;
}

/**
 * What the focus manager knows when its cleanup's queued return focus runs.
 */
export interface ReturnFocusSnapshot {
  /**
   * The `returnFocus` option when the cleanup ran.
   */
  returnFocus: ReturnFocusOption;
  /**
   * Whether `returnFocus` is an explicit consumer target, if the caller said so.
   */
  explicitReturnFocus: boolean | undefined;
  /**
   * The element to focus: the return element, or its first tabbable descendant.
   */
  returnElement: Element | null;
  /**
   * The focused element when the cleanup ran.
   */
  activeElement: Element | null;
  /**
   * The document body.
   */
  body: HTMLElement;
  /**
   * Whether focus was inside the floating tree when the cleanup ran.
   */
  isFocusInsideFloatingTree: boolean;
  /**
   * The type of the interaction that closed the popup, when the cleanup ran.
   */
  closeType: InteractionType;
}

/**
 * Return focus rule: decides whether a closed popup returns focus, and how.
 *
 * Focus returns unless it was suppressed or the return was cancelled. With the dynamic default
 * target, focus that has already moved outside the floating tree is respected; an explicit target
 * is focused regardless. A keyboard close makes the focus visible.
 *
 * @returns The element to focus and the options to focus it with, or `null` to leave focus alone.
 */
export function returnFocusOnClose(
  session: FocusReturnSession,
  job: { cancelled: boolean },
  snapshot: ReturnFocusSnapshot,
): { element: HTMLElement; options: FocusOptions } | null {
  const { returnFocus, returnElement, activeElement, body, isFocusInsideFloatingTree, closeType } =
    snapshot;
  const hasExplicitReturnFocus = snapshot.explicitReturnFocus ?? typeof returnFocus !== 'boolean';

  if (
    job.cancelled ||
    !returnFocus ||
    session.preventReturnFocus ||
    !isHTMLElement(returnElement) ||
    // If the focus moved somewhere else after mount, avoid returning focus since it likely entered
    // a different element which should be respected:
    // https://github.com/floating-ui/floating-ui/issues/2607
    (!hasExplicitReturnFocus &&
      returnElement !== activeElement &&
      activeElement !== body &&
      !isFocusInsideFloatingTree)
  ) {
    return null;
  }

  const options: FocusOptions = { preventScroll: true };
  if (closeType === 'keyboard') {
    options.focusVisible = true;
  }
  return { element: returnElement, options };
}
