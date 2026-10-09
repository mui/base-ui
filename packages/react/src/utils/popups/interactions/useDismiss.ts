'use client';
/* eslint-disable no-underscore-dangle */
import * as React from 'react';
import { addEventListener } from '@base-ui/utils/addEventListener';
import { mergeCleanups } from '@base-ui/utils/mergeCleanups';
import { ownerDocument } from '@base-ui/utils/owner';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { Timeout, useTimeout } from '@base-ui/utils/useTimeout';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import {
  getComputedStyle,
  getParentNode,
  isElement,
  isHTMLElement,
  isLastTraversableNode,
  isShadowRoot,
} from '@floating-ui/utils/dom';
import { platform } from '@base-ui/utils/platform';
import { contains, getTarget } from '@base-ui/utils/shadowDom';
import { useFloatingTree } from '../tree/FloatingTree';
import type { FloatingTreeStore } from '../tree/FloatingTreeStore';
import type { ElementProps, FloatingRootContext } from '../floating-root/types';
import { createChangeEventDetails } from '../../../internals/createBaseUIEventDetails';
import { REASONS } from '../../../internals/reasons';
import { createAttribute } from '../createAttribute';
import { isEventTargetWithin, isRootElement } from '../element';
import { isReactEvent, isVirtualClick } from '../event';
import { endPressSessionOnClose, getPopupDismissal } from './popupDismissal';
import type { OutsidePressType } from './popupDismissal';

type PressType = OutsidePressType;

function alwaysFalse() {
  return false;
}

export function normalizeProp(
  normalizable?: boolean | { escapeKey?: boolean | undefined; outsidePress?: boolean | undefined },
) {
  return {
    escapeKey:
      typeof normalizable === 'boolean' ? normalizable : (normalizable?.escapeKey ?? false),
    outsidePress:
      typeof normalizable === 'boolean' ? normalizable : (normalizable?.outsidePress ?? true),
  };
}

export interface UseDismissProps {
  /**
   * Whether the Hook is enabled, including all internal Effects and event
   * handlers.
   * @default true
   */
  enabled?: boolean | undefined;
  /**
   * Whether to dismiss the floating element upon pressing the `esc` key.
   * @default true
   */
  escapeKey?: boolean | undefined;
  /**
   * Whether to dismiss the floating element upon pressing the reference
   * element. You likely want to ensure the `move` option in the `useHover()`
   * Hook has been disabled when this is in use.
   *
   * A lazy getter invoked when handling reference press events.
   * @default false
   */
  referencePress?: (() => boolean) | undefined;
  /**
   * Whether to dismiss the floating element upon pressing outside of the
   * floating element.
   * If you have another element, like a toast, that is rendered outside the
   * floating element's React tree and don't want the floating element to close
   * when pressing it, you can guard the check like so:
   * ```jsx
   * useDismiss(context, {
   *   outsidePress: (event) => !event.target.closest('.toast'),
   * });
   * ```
   * @default true
   */
  outsidePress?: boolean | ((event: MouseEvent | TouchEvent) => boolean) | undefined;
  /**
   * The type of event to use to determine an outside "press".
   * - `intentional` dismisses on an outside `click` whose press began while the floating element was open, ignoring the trailing click of a press that started before it opened. Touch requires minimal `touchmove`s, and press-less clicks (keyboard, assistive technology) are always accepted.
   * - `sloppy` fires on `pointerdown` for mouse, while for touch it fires on `touchend` (within 1 second) or while scrolling away after `touchstart`.
   */
  outsidePressEvent?:
    | PressType
    | {
        mouse: PressType;
        touch: PressType;
      }
    | (() =>
        | PressType
        | {
            mouse: PressType;
            touch: PressType;
          })
    | undefined;
  /**
   * Determines whether event listeners bubble upwards through a tree of
   * floating elements.
   */
  bubbles?:
    boolean | { escapeKey?: boolean | undefined; outsidePress?: boolean | undefined } | undefined;
  /**
   * External FloatingTree to use when the one provided by context can't be used.
   */
  externalTree?: FloatingTreeStore | undefined;
}

/**
 * Closes the floating element when a dismissal is requested — by default, when
 * the user presses the `escape` key or outside of the floating element.
 * @see https://floating-ui.com/docs/useDismiss
 */
export function useDismiss(store: FloatingRootContext, props: UseDismissProps = {}): ElementProps {
  const {
    enabled = true,
    escapeKey = true,
    outsidePress: outsidePressProp = true,
    outsidePressEvent = 'sloppy',
    referencePress = alwaysFalse,
    bubbles,
    externalTree,
  } = props;

  const open = store.useState('open');
  const floatingElement = store.useState('floatingElement');
  const { dataRef } = store.context;

  const tree = useFloatingTree(externalTree);
  const outsidePressFn = useStableCallback(
    typeof outsidePressProp === 'function' ? outsidePressProp : () => false,
  );
  const outsidePress = typeof outsidePressProp === 'function' ? outsidePressFn : outsidePressProp;
  const outsidePressEnabled = outsidePress !== false;
  const getOutsidePressEventProp = useStableCallback(() => outsidePressEvent);

  const { escapeKey: escapeKeyBubbles, outsidePress: outsidePressBubbles } = normalizeProp(bubbles);

  const dismissal = getPopupDismissal(store);
  // The press, touch and composition state of this instance.
  const session = useRefWithInit(() => dismissal.createDismissSession()).current;

  const cancelDismissOnEndTimeout = useTimeout();
  const clearInsideReactTreeTimeout = useTimeout();
  // Outlives effect re-runs so a pending reset can't leave `isComposingRef` stuck.
  const compositionTimeout = useTimeout();

  const clearInsideReactTree = useStableCallback(() => {
    clearInsideReactTreeTimeout.clear();
    dismissal.setInsideReactTree(false);
  });

  const hasBlockingChild = useStableCallback((kind: 'escapeKey' | 'outsidePress') => {
    const nodeId = dataRef.current.positioning?.nodeId;
    return tree ? tree.hasBlockingChild(nodeId, kind) : false;
  });

  const isEventWithinOwnElements = useStableCallback((event: Event) => {
    return (
      isEventTargetWithin(event, store.select('floatingElement')) ||
      isEventTargetWithin(event, store.select('domReferenceElement'))
    );
  });

  const closeOnReferencePress = useStableCallback((event: React.SyntheticEvent) => {
    if (!referencePress()) {
      return;
    }

    store.setOpen(
      false,
      createChangeEventDetails(
        REASONS.triggerPress,
        event.nativeEvent as MouseEvent | PointerEvent | TouchEvent | KeyboardEvent,
      ),
    );
  });

  const closeOnEscapeKeyDown = useStableCallback(
    (event: React.KeyboardEvent<Element> | KeyboardEvent) => {
      if (!open || !enabled || !escapeKey || event.key !== 'Escape') {
        return;
      }

      const native = isReactEvent(event) ? event.nativeEvent : event;

      // Wait until IME is settled. Pressing `Escape` while composing should
      // close the compose menu, but not the floating element. The ref covers Safari, which fires
      // `compositionend` before `keydown`; `isComposing` covers compositions that began while closed.
      if (session.isComposing || native.isComposing) {
        return;
      }

      if (!escapeKeyBubbles && hasBlockingChild('escapeKey')) {
        return;
      }

      const eventDetails = createChangeEventDetails(REASONS.escapeKey, native);

      store.setOpen(false, eventDetails);

      if (!eventDetails.isCanceled) {
        event.preventDefault();
      }

      if (!escapeKeyBubbles && !eventDetails.isPropagationAllowed) {
        event.stopPropagation();
      }
    },
  );

  const markInsideReactTree = useStableCallback(() => {
    dismissal.setInsideReactTree(true);
    clearInsideReactTreeTimeout.start(0, clearInsideReactTree);
  });

  const markPressStartedInsideReactTree = useStableCallback(
    (event: React.PointerEvent | React.MouseEvent) => {
      if (!open || !enabled || event.button !== 0) {
        return;
      }

      const target = getTarget(event.nativeEvent) as Element | null;

      // Only treat presses that start within the floating DOM subtree as inside.
      // This avoids suppressing parent dismissal when interacting with nested portals.
      if (!contains(store.select('floatingElement'), target)) {
        return;
      }

      if (!session.pressStartedInside) {
        session.pressStartedInside = true;
        session.pressStartPrevented = false;
      }
    },
  );

  const markInsidePressStartPrevented = useStableCallback(
    (event: React.PointerEvent | React.MouseEvent) => {
      if (!open || !enabled) {
        return;
      }

      if (!(event.defaultPrevented || event.nativeEvent.defaultPrevented)) {
        return;
      }

      if (session.pressStartedInside) {
        session.pressStartPrevented = true;
      }
    },
  );

  // A same-batch close+reopen never renders `open === false`, so only `openchange` can
  // observe that session boundary. The effect below covers controlled flips.
  React.useEffect(
    () => dismissal.onOpenChange((details) => endPressSessionOnClose(session, details)),
    [dismissal, session],
  );

  // Not cleared in the listener effect's cleanup, which can run mid-press when a dependency
  // changes. In a closed shadow root, the marker is the only inside-press signal.
  React.useEffect(() => clearInsideReactTree, [clearInsideReactTree]);

  React.useEffect(() => {
    if (!open || !enabled) {
      // Reset in the effect body, not the cleanup, which also runs when a dependency
      // changes mid-gesture.
      if (!open) {
        session.sawPressWhileOpen = false;
        session.isComposing = false;
        session.currentPointerType = '';
        session.touchState = null;
      }
      return clearInsideReactTree;
    }

    dataRef.current.__escapeKeyBubbles = escapeKeyBubbles;
    dataRef.current.__outsidePressBubbles = outsidePressBubbles;

    const preventedPressSuppressionTimeout = new Timeout();
    const doc = ownerDocument(floatingElement);

    function handleCompositionStart() {
      compositionTimeout.clear();
      session.isComposing = true;
    }

    function handleCompositionEnd() {
      // Safari fires `compositionend` before `keydown`, so we need to wait
      // until the next tick to set `isComposing` to `false`. Set it here too, since closing
      // resets it while a composition can continue into the next open session.
      // https://bugs.webkit.org/show_bug.cgi?id=165004
      session.isComposing = true;
      compositionTimeout.start(
        // 0ms or 1ms don't work in Safari. 5ms appears to consistently work.
        // Only apply to WebKit for the test to remain 0ms.
        platform.engine.webkit ? 5 : 0,
        () => {
          session.isComposing = false;
        },
      );
    }

    function suppressImmediateOutsideClickAfterPreventedStart() {
      session.suppressNextOutsideClick = true;
      // Firefox can emit the synthetic outside click in a later task after
      // pointer lock exit, so microtask clearing is too early here.
      preventedPressSuppressionTimeout.start(0, () => {
        session.suppressNextOutsideClick = false;
      });
    }

    function resetPressStartState() {
      session.pressStartedInside = false;
      session.pressStartPrevented = false;
    }

    function getOutsidePressEvent(): PressType {
      const type = session.currentPointerType as 'pen' | 'mouse' | 'touch' | '';
      const computedType = type === 'pen' || !type ? 'mouse' : type;

      const outsidePressEventValue = getOutsidePressEventProp();
      const resolved =
        typeof outsidePressEventValue === 'function'
          ? outsidePressEventValue()
          : outsidePressEventValue;

      if (typeof resolved === 'string') {
        return resolved;
      }

      return resolved[computedType];
    }

    function shouldIgnoreEvent(event: Event) {
      const computedOutsidePressEvent = getOutsidePressEvent();
      return (
        (computedOutsidePressEvent === 'intentional' && event.type !== 'click') ||
        (computedOutsidePressEvent === 'sloppy' && event.type === 'click')
      );
    }

    function isEventWithinFloatingTree(event: Event) {
      const nodeId = dataRef.current.positioning?.nodeId;
      const targetIsInsideChildren =
        tree &&
        tree
          .descendants(nodeId)
          .some((node) => isEventTargetWithin(event, node.context?.elements.floating));

      return isEventWithinOwnElements(event) || targetIsInsideChildren;
    }

    function closeOnPressOutside(event: MouseEvent | PointerEvent | TouchEvent) {
      if (shouldIgnoreEvent(event)) {
        // A new press began outside the floating element and its trigger. Clear any
        // leftover drag-out suppression so this press's eventual click can dismiss.
        if (event.type !== 'click' && !isEventWithinOwnElements(event)) {
          preventedPressSuppressionTimeout.clear();
          session.suppressNextOutsideClick = false;
        }
        clearInsideReactTree();
        return;
      }

      if (dismissal.isInsideReactTree()) {
        clearInsideReactTree();
        return;
      }

      const target = getTarget(event);
      const inertSelector = `[${createAttribute('inert')}]`;
      const targetRoot = isElement(target) ? target.getRootNode() : null;
      const markers = Array.from(
        (isShadowRoot(targetRoot)
          ? targetRoot
          : ownerDocument(store.select('floatingElement'))
        ).querySelectorAll(inertSelector),
      );

      const triggers = store.context.triggerElements;

      // If another trigger is clicked, don't close the floating element.
      if (
        target &&
        (triggers.hasElement(target as Element) ||
          triggers.hasMatchingElement((trigger) => contains(trigger, target as Element)))
      ) {
        return;
      }

      let targetRootAncestor = isElement(target) ? target : null;
      while (targetRootAncestor && !isLastTraversableNode(targetRootAncestor)) {
        const nextParent = getParentNode(targetRootAncestor);
        if (isLastTraversableNode(nextParent) || !isElement(nextParent)) {
          break;
        }

        targetRootAncestor = nextParent;
      }

      // Check if the click occurred on a third-party element injected after the
      // floating element rendered.
      if (
        markers.length &&
        isElement(target) &&
        !isRootElement(target) &&
        // Clicked on a direct ancestor (e.g. FloatingOverlay).
        !contains(target, store.select('floatingElement')) &&
        // If the target root element contains none of the markers, then the
        // element was injected after the floating element rendered.
        markers.every((marker) => !contains(targetRootAncestor, marker))
      ) {
        return;
      }

      // Check if the click occurred on the scrollbar
      // Skip for touch events: scrollbars don't receive touch events on most platforms
      if (isHTMLElement(target) && !('touches' in event)) {
        const lastTraversableNode = isLastTraversableNode(target);
        const style = getComputedStyle(target);
        const scrollRe = /auto|scroll/;
        const isScrollableX = lastTraversableNode || scrollRe.test(style.overflowX);
        const isScrollableY = lastTraversableNode || scrollRe.test(style.overflowY);

        const canScrollX =
          isScrollableX && target.clientWidth > 0 && target.scrollWidth > target.clientWidth;
        const canScrollY =
          isScrollableY && target.clientHeight > 0 && target.scrollHeight > target.clientHeight;

        const isRTL = style.direction === 'rtl';

        // Check click position relative to scrollbar.
        // In some browsers it is possible to change the <body> (or window)
        // scrollbar to the left side, but is very rare and is difficult to
        // check for. Plus, for modal dialogs with backdrops, it is more
        // important that the backdrop is checked but not so much the window.
        const pressedVerticalScrollbar =
          canScrollY &&
          (isRTL
            ? event.offsetX <= target.offsetWidth - target.clientWidth
            : event.offsetX > target.clientWidth);

        const pressedHorizontalScrollbar = canScrollX && event.offsetY > target.clientHeight;

        if (pressedVerticalScrollbar || pressedHorizontalScrollbar) {
          return;
        }
      }

      if (isEventWithinFloatingTree(event)) {
        return;
      }

      // Only `click` events reach this point in intentional mode.
      if (getOutsidePressEvent() === 'intentional') {
        // Press-less clicks (keyboard, assistive technology, `element.click()`) report no
        // click count; `isVirtualClick` also catches the ones that do.
        if (
          (event as MouseEvent).detail !== 0 &&
          !isVirtualClick(event as MouseEvent) &&
          !session.sawPressWhileOpen
        ) {
          return;
        }

        // A press that starts inside and ends outside gets one suppressed
        // outside click. Run this after inside-target checks so inside clicks
        // don't consume the one-shot suppression.
        if (session.suppressNextOutsideClick) {
          preventedPressSuppressionTimeout.clear();
          session.suppressNextOutsideClick = false;
          return;
        }
      }

      if (typeof outsidePress === 'function' && !outsidePress(event)) {
        return;
      }

      if (hasBlockingChild('outsidePress')) {
        return;
      }

      store.setOpen(false, createChangeEventDetails(REASONS.outsidePress, event));
      clearInsideReactTree();
    }

    function handlePointerDown(event: PointerEvent) {
      if (
        getOutsidePressEvent() !== 'sloppy' ||
        event.pointerType === 'touch' ||
        !store.select('open') ||
        !enabled ||
        isEventWithinOwnElements(event)
      ) {
        return;
      }

      closeOnPressOutside(event);
    }

    function handleTouchStart(event: TouchEvent) {
      if (
        getOutsidePressEvent() !== 'sloppy' ||
        !store.select('open') ||
        !enabled ||
        isEventWithinOwnElements(event)
      ) {
        return;
      }

      const touch = event.touches[0];
      if (touch) {
        session.touchState = {
          startTime: Date.now(),
          startX: touch.clientX,
          startY: touch.clientY,
          dismissOnTouchEnd: false,
          dismissOnMouseDown: true,
        };

        cancelDismissOnEndTimeout.start(1000, () => {
          if (session.touchState) {
            session.touchState.dismissOnTouchEnd = false;
            session.touchState.dismissOnMouseDown = false;
          }
        });
      }
    }

    function addTargetEventListenerOnce<EventType extends Event>(
      event: EventType,
      listener: (event: EventType) => void,
    ) {
      const target = getTarget(event);

      if (!target) {
        return;
      }

      const unsubscribe = addEventListener(target, event.type, () => {
        listener(event);
        unsubscribe();
      });
    }

    function handleTouchStartCapture(event: TouchEvent) {
      session.currentPointerType = 'touch';
      addTargetEventListenerOnce(event, handleTouchStart);
    }

    function closeOnPressOutsideCapture(event: PointerEvent | MouseEvent) {
      cancelDismissOnEndTimeout.clear();

      // Only `pointerdown` marks a press; `mousedown` is its compatibility event, and
      // counting it would misattribute a gesture that started before open.
      if (event.type === 'pointerdown') {
        // Only a primary press can produce a `click`.
        if (event.button === 0) {
          session.sawPressWhileOpen = true;
        }
        session.currentPointerType = (event as PointerEvent).pointerType;
      }

      if (
        event.type === 'mousedown' &&
        session.touchState &&
        !session.touchState.dismissOnMouseDown
      ) {
        return;
      }

      addTargetEventListenerOnce(event, (targetEvent) => {
        if (targetEvent.type === 'pointerdown') {
          handlePointerDown(targetEvent as PointerEvent);
        } else {
          closeOnPressOutside(targetEvent as MouseEvent);
        }
      });
    }

    function handlePressEndCapture(event: PointerEvent | MouseEvent) {
      // A cancelled gesture produces no click. Not cleared on `pointerup`: the click
      // fires after it and must still find the press.
      if (event.type === 'pointercancel') {
        session.sawPressWhileOpen = false;
      }

      if (!session.pressStartedInside) {
        return;
      }

      const pressStartedInsideDefaultPrevented = session.pressStartPrevented;
      resetPressStartState();

      if (getOutsidePressEvent() !== 'intentional') {
        return;
      }

      if (event.type === 'pointercancel') {
        if (pressStartedInsideDefaultPrevented) {
          suppressImmediateOutsideClickAfterPreventedStart();
        }
        return;
      }

      if (isEventWithinFloatingTree(event)) {
        return;
      }

      // If pointerdown was prevented, no click may be generated for that
      // interaction. However, Firefox may still emit an immediate click after
      // pointerup (e.g. NumberField scrub with pointer lock), so suppress for
      // one tick to absorb that synthetic click only.
      if (pressStartedInsideDefaultPrevented) {
        suppressImmediateOutsideClickAfterPreventedStart();
        return;
      }

      // Avoid suppressing when outsidePress explicitly ignores this target.
      if (typeof outsidePress === 'function' && !outsidePress(event as MouseEvent)) {
        return;
      }

      preventedPressSuppressionTimeout.clear();
      session.suppressNextOutsideClick = true;
      clearInsideReactTree();
    }

    function handleTouchMove(event: TouchEvent) {
      if (
        getOutsidePressEvent() !== 'sloppy' ||
        !session.touchState ||
        isEventWithinOwnElements(event)
      ) {
        return;
      }

      const touch = event.touches[0];
      if (!touch) {
        return;
      }

      const deltaX = Math.abs(touch.clientX - session.touchState.startX);
      const deltaY = Math.abs(touch.clientY - session.touchState.startY);
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (distance > 5) {
        session.touchState.dismissOnTouchEnd = true;
      }

      if (distance > 10) {
        closeOnPressOutside(event);
        cancelDismissOnEndTimeout.clear();
        session.touchState = null;
      }
    }

    function handleTouchMoveCapture(event: TouchEvent) {
      addTargetEventListenerOnce(event, handleTouchMove);
    }

    function handleTouchEnd(event: TouchEvent) {
      if (
        getOutsidePressEvent() !== 'sloppy' ||
        !session.touchState ||
        isEventWithinOwnElements(event)
      ) {
        return;
      }

      if (session.touchState.dismissOnTouchEnd) {
        closeOnPressOutside(event);
      }

      cancelDismissOnEndTimeout.clear();
      session.touchState = null;
    }

    function handleTouchEndCapture(event: TouchEvent) {
      addTargetEventListenerOnce(event, handleTouchEnd);
    }

    const unsubscribe = mergeCleanups(
      escapeKey &&
        mergeCleanups(
          addEventListener(doc, 'keydown', closeOnEscapeKeyDown),
          addEventListener(doc, 'compositionstart', handleCompositionStart),
          addEventListener(doc, 'compositionend', handleCompositionEnd),
        ),
      outsidePressEnabled &&
        mergeCleanups(
          addEventListener(doc, 'click', closeOnPressOutsideCapture, true),
          addEventListener(doc, 'pointerdown', closeOnPressOutsideCapture, true),
          addEventListener(doc, 'pointerup', handlePressEndCapture, true),
          addEventListener(doc, 'pointercancel', handlePressEndCapture, true),
          addEventListener(doc, 'mousedown', closeOnPressOutsideCapture, true),
          addEventListener(doc, 'mouseup', handlePressEndCapture, true),
          addEventListener(doc, 'touchstart', handleTouchStartCapture, {
            capture: true,
            passive: true,
          }),
          addEventListener(doc, 'touchmove', handleTouchMoveCapture, {
            capture: true,
            passive: true,
          }),
          addEventListener(doc, 'touchend', handleTouchEndCapture, {
            capture: true,
            passive: true,
          }),
        ),
    );

    return () => {
      unsubscribe();
      preventedPressSuppressionTimeout.clear();
      resetPressStartState();
      session.suppressNextOutsideClick = false;
    };
  }, [
    dataRef,
    dismissal,
    session,
    floatingElement,
    escapeKey,
    outsidePressEnabled,
    outsidePress,
    open,
    enabled,
    escapeKeyBubbles,
    outsidePressBubbles,
    closeOnEscapeKeyDown,
    clearInsideReactTree,
    getOutsidePressEventProp,
    hasBlockingChild,
    isEventWithinOwnElements,
    tree,
    store,
    cancelDismissOnEndTimeout,
    compositionTimeout,
  ]);

  const reference: ElementProps['reference'] = React.useMemo(
    () => ({
      onKeyDown: closeOnEscapeKeyDown,
      onPointerDown: closeOnReferencePress,
      onClick: closeOnReferencePress,
    }),
    [closeOnEscapeKeyDown, closeOnReferencePress],
  );

  const floating: ElementProps['floating'] = React.useMemo(
    () => ({
      onKeyDown: closeOnEscapeKeyDown,
      // `onMouseDown` may be blocked if `event.preventDefault()` is called in
      // `onPointerDown`, such as with <NumberField.ScrubArea>.
      // See https://github.com/mui/base-ui/pull/3379
      onPointerDown: markInsidePressStartPrevented,
      onMouseDown: markInsidePressStartPrevented,
      onClickCapture: markInsideReactTree,
      onMouseDownCapture(event) {
        markInsideReactTree();
        markPressStartedInsideReactTree(event);
      },
      onPointerDownCapture(event) {
        markInsideReactTree();
        markPressStartedInsideReactTree(event);
      },
      onMouseUpCapture: markInsideReactTree,
      onTouchEndCapture: markInsideReactTree,
      onTouchMoveCapture: markInsideReactTree,
    }),
    [
      closeOnEscapeKeyDown,
      markInsideReactTree,
      markPressStartedInsideReactTree,
      markInsidePressStartPrevented,
    ],
  );

  return React.useMemo(
    () => (enabled ? { reference, floating, trigger: reference } : {}),
    [enabled, reference, floating],
  );
}
