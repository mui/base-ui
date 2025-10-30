import * as React from 'react';
import { getOverflowAncestors } from '@floating-ui/react-dom';
import {
  getComputedStyle,
  getParentNode,
  isElement,
  isHTMLElement,
  isLastTraversableNode,
  isWebKit,
} from '@floating-ui/utils/dom';
import { Timeout, useTimeout } from '@base-ui-components/utils/useTimeout';
import { useStableCallback } from '@base-ui-components/utils/useStableCallback';
import {
  contains,
  getDocument,
  getTarget,
  isEventTargetWithin,
  isReactEvent,
  isRootElement,
  getNodeChildren,
} from '../utils';

/* eslint-disable no-underscore-dangle */

import { useFloatingTree } from '../components/FloatingTree';
import type { ElementProps, FloatingRootContext } from '../types';
import { createChangeEventDetails } from '../../utils/createBaseUIEventDetails';
import { createAttribute } from '../utils/createAttribute';

type PressType = 'intentional' | 'sloppy';

const bubbleHandlerKeys = {
  intentional: 'onClick',
  sloppy: 'onPointerDown',
} as const;

export function normalizeProp(
  normalizable?: boolean | { escapeKey?: boolean; outsidePress?: boolean },
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
  enabled?: boolean;
  /**
   * Whether to dismiss the floating element upon pressing the `esc` key.
   * @default true
   */
  escapeKey?: boolean;
  /**
   * Whether to dismiss the floating element upon pressing the reference
   * element. You likely want to ensure the `move` option in the `useHover()`
   * Hook has been disabled when this is in use.
   * @default false
   */
  referencePress?: boolean;
  /**
   * The type of event to use to determine a "press".
   * - `down` is `pointerdown` on mouse input, but special iOS-like touch handling on touch input.
   * - `up` is lazy on both mouse + touch input (equivalent to `click`).
   * @default 'down'
   */
  referencePressEvent?: PressType;
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
  outsidePress?: boolean | ((event: MouseEvent | TouchEvent) => boolean);
  /**
   * The type of event to use to determine an outside "press".
   * - `intentional` requires the user to click outside intentionally, firing on `pointerup` for mouse, and requiring minimal `touchmove`s for touch.
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
          });
  /**
   * Whether to dismiss the floating element upon scrolling an overflow
   * ancestor.
   * @default false
   */
  ancestorScroll?: boolean;
  /**
   * Determines whether event listeners bubble upwards through a tree of
   * floating elements.
   */
  bubbles?: boolean | { escapeKey?: boolean; outsidePress?: boolean };
}

/**
 * Closes the floating element when a dismissal is requested — by default, when
 * the user presses the `escape` key or outside of the floating element.
 * @see https://floating-ui.com/docs/useDismiss
 */
export function useDismiss(
  context: FloatingRootContext,
  props: UseDismissProps = {},
): ElementProps {
  const { open, onOpenChange, elements, dataRef } = context;
  const {
    enabled = true,
    escapeKey = true,
    outsidePress: outsidePressProp = true,
    outsidePressEvent = 'sloppy',
    referencePress = false,
    referencePressEvent = 'sloppy',
    ancestorScroll = false,
    bubbles,
  } = props;

  const tree = useFloatingTree();
  const outsidePressFn = useStableCallback(
    typeof outsidePressProp === 'function' ? outsidePressProp : () => false,
  );
  const outsidePress = typeof outsidePressProp === 'function' ? outsidePressFn : outsidePressProp;

  const endedOrStartedInsideRef = React.useRef(false);
  const { escapeKey: escapeKeyBubbles, outsidePress: outsidePressBubbles } = normalizeProp(bubbles);

  const touchStateRef = React.useRef<{
    startTime: number;
    startX: number;
    startY: number;
    dismissOnTouchEnd: boolean;
    dismissOnMouseDown: boolean;
  } | null>(null);

  const cancelDismissOnEndTimeout = useTimeout();
  const clearInsideReactTreeTimeout = useTimeout();

  const clearInsideReactTree = useStableCallback(() => {
    clearInsideReactTreeTimeout.clear();
    dataRef.current.insideReactTree = false;
  });

  const isComposingRef = React.useRef(false);
  const currentPointerTypeRef = React.useRef<PointerEvent['pointerType']>('');

  const trackPointerType = useStableCallback((event: PointerEvent) => {
    currentPointerTypeRef.current = event.pointerType;
  });

  const getOutsidePressEvent = useStableCallback(() => {
    const type = currentPointerTypeRef.current as 'pen' | 'mouse' | 'touch' | '';
    const computedType = type === 'pen' || !type ? 'mouse' : type;

    const resolved =
      typeof outsidePressEvent === 'function' ? outsidePressEvent() : outsidePressEvent;

    if (typeof resolved === 'string') {
      return resolved;
    }

    return resolved[computedType];
  });

  const closeOnEscapeKeyDown = useStableCallback(
    (event: React.KeyboardEvent<Element> | KeyboardEvent) => {
      if (!open || !enabled || !escapeKey || event.key !== 'Escape') {
        return;
      }

      // Wait until IME is settled. Pressing `Escape` while composing should
      // close the compose menu, but not the floating element.
      if (isComposingRef.current) {
        return;
      }

      const nodeId = dataRef.current.floatingContext?.nodeId;

      const children = tree ? getNodeChildren(tree.nodesRef.current, nodeId) : [];

      if (!escapeKeyBubbles) {
        if (children.length > 0) {
          let shouldDismiss = true;

          children.forEach((child) => {
            if (child.context?.open && !child.context.dataRef.current.__escapeKeyBubbles) {
              shouldDismiss = false;
            }
          });

          if (!shouldDismiss) {
            return;
          }
        }
      }

      const native = isReactEvent(event) ? event.nativeEvent : event;
      const eventDetails = createChangeEventDetails('escape-key', native);

      onOpenChange(false, eventDetails);

      if (!escapeKeyBubbles && !eventDetails.isPropagationAllowed) {
        event.stopPropagation();
      }
    },
  );

  const shouldIgnoreEvent = useStableCallback((event: Event) => {
    const computedOutsidePressEvent = getOutsidePressEvent();
    return (
      (computedOutsidePressEvent === 'intentional' && event.type !== 'click') ||
      (computedOutsidePressEvent === 'sloppy' && event.type === 'click')
    );
  });

  const markInsideReactTree = useStableCallback(() => {
    dataRef.current.insideReactTree = true;
    clearInsideReactTreeTimeout.start(0, clearInsideReactTree);
  });

  const closeOnPressOutside = useStableCallback(
    (event: MouseEvent | PointerEvent | TouchEvent, endedOrStartedInside = false) => {
      if (shouldIgnoreEvent(event)) {
        clearInsideReactTree();
        return;
      }

      if (dataRef.current.insideReactTree) {
        clearInsideReactTree();
        return;
      }

      if (getOutsidePressEvent() === 'intentional' && endedOrStartedInside) {
        return;
      }

      if (typeof outsidePress === 'function' && !outsidePress(event)) {
        return;
      }

      const target = getTarget(event);
      const inertSelector = `[${createAttribute('inert')}]`;
      const markers = getDocument(elements.floating).querySelectorAll(inertSelector);

      // If another trigger is clicked, don't close the floating element.
      if (target && elements.triggers?.some((trigger) => contains(trigger, target as Element))) {
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
        !contains(target, elements.floating) &&
        // If the target root element contains none of the markers, then the
        // element was injected after the floating element rendered.
        Array.from(markers).every((marker) => !contains(targetRootAncestor, marker))
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

      const nodeId = dataRef.current.floatingContext?.nodeId;

      const targetIsInsideChildren =
        tree &&
        getNodeChildren(tree.nodesRef.current, nodeId).some((node) =>
          isEventTargetWithin(event, node.context?.elements.floating),
        );

      if (
        isEventTargetWithin(event, elements.floating) ||
        isEventTargetWithin(event, elements.domReference) ||
        targetIsInsideChildren
      ) {
        return;
      }

      const children = tree ? getNodeChildren(tree.nodesRef.current, nodeId) : [];
      if (children.length > 0) {
        let shouldDismiss = true;

        children.forEach((child) => {
          if (child.context?.open && !child.context.dataRef.current.__outsidePressBubbles) {
            shouldDismiss = false;
          }
        });

        if (!shouldDismiss) {
          return;
        }
      }

      onOpenChange(false, createChangeEventDetails('outside-press', event));
      clearInsideReactTree();
    },
  );

  const handlePointerDown = useStableCallback((event: PointerEvent) => {
    if (
      getOutsidePressEvent() !== 'sloppy' ||
      event.pointerType === 'touch' ||
      !open ||
      !enabled ||
      isEventTargetWithin(event, elements.floating) ||
      isEventTargetWithin(event, elements.domReference)
    ) {
      return;
    }

    closeOnPressOutside(event);
  });

  const handleTouchStart = useStableCallback((event: TouchEvent) => {
    if (
      getOutsidePressEvent() !== 'sloppy' ||
      !open ||
      !enabled ||
      isEventTargetWithin(event, elements.floating) ||
      isEventTargetWithin(event, elements.domReference)
    ) {
      return;
    }

    const touch = event.touches[0];
    if (touch) {
      touchStateRef.current = {
        startTime: Date.now(),
        startX: touch.clientX,
        startY: touch.clientY,
        dismissOnTouchEnd: false,
        dismissOnMouseDown: true,
      };

      cancelDismissOnEndTimeout.start(1000, () => {
        if (touchStateRef.current) {
          touchStateRef.current.dismissOnTouchEnd = false;
          touchStateRef.current.dismissOnMouseDown = false;
        }
      });
    }
  });

  const handleTouchStartCapture = useStableCallback((event: TouchEvent) => {
    const target = getTarget(event);
    function callback() {
      handleTouchStart(event);
      target?.removeEventListener(event.type, callback);
    }
    target?.addEventListener(event.type, callback);
  });

  const closeOnPressOutsideCapture = useStableCallback((event: PointerEvent | MouseEvent) => {
    // When click outside is lazy (`up` event), handle dragging.
    // Don't close if:
    // - The click started inside the floating element.
    // - The click ended inside the floating element.
    const endedOrStartedInside = endedOrStartedInsideRef.current;
    endedOrStartedInsideRef.current = false;

    cancelDismissOnEndTimeout.clear();

    if (
      event.type === 'mousedown' &&
      touchStateRef.current &&
      !touchStateRef.current.dismissOnMouseDown
    ) {
      return;
    }

    const target = getTarget(event);

    function callback() {
      if (event.type === 'pointerdown') {
        handlePointerDown(event as PointerEvent);
      } else {
        closeOnPressOutside(event as MouseEvent, endedOrStartedInside);
      }
      target?.removeEventListener(event.type, callback);
    }
    target?.addEventListener(event.type, callback);
  });

  const handleTouchMove = useStableCallback((event: TouchEvent) => {
    if (
      getOutsidePressEvent() !== 'sloppy' ||
      !touchStateRef.current ||
      isEventTargetWithin(event, elements.floating) ||
      isEventTargetWithin(event, elements.domReference)
    ) {
      return;
    }

    const touch = event.touches[0];
    if (!touch) {
      return;
    }

    const deltaX = Math.abs(touch.clientX - touchStateRef.current.startX);
    const deltaY = Math.abs(touch.clientY - touchStateRef.current.startY);
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance > 5) {
      touchStateRef.current.dismissOnTouchEnd = true;
    }

    if (distance > 10) {
      closeOnPressOutside(event);
      cancelDismissOnEndTimeout.clear();
      touchStateRef.current = null;
    }
  });

  const handleTouchMoveCapture = useStableCallback((event: TouchEvent) => {
    const target = getTarget(event);
    function callback() {
      handleTouchMove(event);
      target?.removeEventListener(event.type, callback);
    }
    target?.addEventListener(event.type, callback);
  });

  const handleTouchEnd = useStableCallback((event: TouchEvent) => {
    if (
      getOutsidePressEvent() !== 'sloppy' ||
      !touchStateRef.current ||
      isEventTargetWithin(event, elements.floating) ||
      isEventTargetWithin(event, elements.domReference)
    ) {
      return;
    }

    if (touchStateRef.current.dismissOnTouchEnd) {
      closeOnPressOutside(event);
    }

    cancelDismissOnEndTimeout.clear();
    touchStateRef.current = null;
  });

  const handleTouchEndCapture = useStableCallback((event: TouchEvent) => {
    const target = getTarget(event);
    function callback() {
      handleTouchEnd(event);
      target?.removeEventListener(event.type, callback);
    }
    target?.addEventListener(event.type, callback);
  });

  React.useEffect(() => {
    if (!open || !enabled) {
      return undefined;
    }

    dataRef.current.__escapeKeyBubbles = escapeKeyBubbles;
    dataRef.current.__outsidePressBubbles = outsidePressBubbles;

    const compositionTimeout = new Timeout();

    function onScroll(event: Event) {
      onOpenChange(false, createChangeEventDetails('none', event));
    }

    function handleCompositionStart() {
      compositionTimeout.clear();
      isComposingRef.current = true;
    }

    function handleCompositionEnd() {
      // Safari fires `compositionend` before `keydown`, so we need to wait
      // until the next tick to set `isComposing` to `false`.
      // https://bugs.webkit.org/show_bug.cgi?id=165004
      compositionTimeout.start(
        // 0ms or 1ms don't work in Safari. 5ms appears to consistently work.
        // Only apply to WebKit for the test to remain 0ms.
        isWebKit() ? 5 : 0,
        () => {
          isComposingRef.current = false;
        },
      );
    }

    const doc = getDocument(elements.floating);

    doc.addEventListener('pointerdown', trackPointerType, true);

    if (escapeKey) {
      doc.addEventListener('keydown', closeOnEscapeKeyDown);
      doc.addEventListener('compositionstart', handleCompositionStart);
      doc.addEventListener('compositionend', handleCompositionEnd);
    }

    if (outsidePress) {
      doc.addEventListener('click', closeOnPressOutsideCapture, true);
      doc.addEventListener('pointerdown', closeOnPressOutsideCapture, true);
      doc.addEventListener('touchstart', handleTouchStartCapture, true);
      doc.addEventListener('touchmove', handleTouchMoveCapture, true);
      doc.addEventListener('touchend', handleTouchEndCapture, true);
      doc.addEventListener('mousedown', closeOnPressOutsideCapture, true);
    }

    let ancestors: (Element | Window | VisualViewport)[] = [];

    if (ancestorScroll) {
      if (isElement(elements.domReference)) {
        ancestors = getOverflowAncestors(elements.domReference);
      }

      if (isElement(elements.floating)) {
        ancestors = ancestors.concat(getOverflowAncestors(elements.floating));
      }

      if (
        !isElement(elements.reference) &&
        elements.reference &&
        elements.reference.contextElement
      ) {
        ancestors = ancestors.concat(getOverflowAncestors(elements.reference.contextElement));
      }
    }

    // Ignore the visual viewport for scrolling dismissal (allow pinch-zoom)
    ancestors = ancestors.filter((ancestor) => ancestor !== doc.defaultView?.visualViewport);

    ancestors.forEach((ancestor) => {
      ancestor.addEventListener('scroll', onScroll, { passive: true });
    });

    return () => {
      doc.removeEventListener('pointerdown', trackPointerType, true);

      if (escapeKey) {
        doc.removeEventListener('keydown', closeOnEscapeKeyDown);
        doc.removeEventListener('compositionstart', handleCompositionStart);
        doc.removeEventListener('compositionend', handleCompositionEnd);
      }

      if (outsidePress) {
        doc.removeEventListener('click', closeOnPressOutsideCapture, true);
        doc.removeEventListener('pointerdown', closeOnPressOutsideCapture, true);
        doc.removeEventListener('touchstart', handleTouchStartCapture, true);
        doc.removeEventListener('touchmove', handleTouchMoveCapture, true);
        doc.removeEventListener('touchend', handleTouchEndCapture, true);
        doc.removeEventListener('mousedown', closeOnPressOutsideCapture, true);
      }

      ancestors.forEach((ancestor) => {
        ancestor.removeEventListener('scroll', onScroll);
      });

      compositionTimeout.clear();
    };
  }, [
    dataRef,
    elements,
    escapeKey,
    outsidePress,
    open,
    onOpenChange,
    ancestorScroll,
    enabled,
    escapeKeyBubbles,
    outsidePressBubbles,
    closeOnEscapeKeyDown,
    closeOnPressOutside,
    closeOnPressOutsideCapture,
    handlePointerDown,
    handleTouchStartCapture,
    handleTouchMoveCapture,
    handleTouchEndCapture,
    trackPointerType,
  ]);

  React.useEffect(clearInsideReactTree, [outsidePress, clearInsideReactTree]);

  const reference: ElementProps['reference'] = React.useMemo(
    () => ({
      onKeyDown: closeOnEscapeKeyDown,
      ...(referencePress && {
        [bubbleHandlerKeys[referencePressEvent]]: (event: React.SyntheticEvent) => {
          onOpenChange(false, createChangeEventDetails('trigger-press', event.nativeEvent as any));
        },
        ...(referencePressEvent !== 'intentional' && {
          onClick(event) {
            onOpenChange(false, createChangeEventDetails('trigger-press', event.nativeEvent));
          },
        }),
      }),
    }),
    [closeOnEscapeKeyDown, onOpenChange, referencePress, referencePressEvent],
  );

  const handlePressedInside = useStableCallback((event: React.MouseEvent) => {
    const target = getTarget(event.nativeEvent) as Element | null;
    if (!contains(elements.floating, target) || event.button !== 0) {
      return;
    }
    endedOrStartedInsideRef.current = true;
  });

  const floating: ElementProps['floating'] = React.useMemo(
    () => ({
      onKeyDown: closeOnEscapeKeyDown,
      onMouseDown: handlePressedInside,
      onMouseUp: handlePressedInside,
      onPointerDownCapture: markInsideReactTree,
      onMouseDownCapture: markInsideReactTree,
      onClickCapture: markInsideReactTree,
      onMouseUpCapture: markInsideReactTree,
      onTouchEndCapture: markInsideReactTree,
      onTouchMoveCapture: markInsideReactTree,
    }),
    [closeOnEscapeKeyDown, handlePressedInside, markInsideReactTree],
  );

  return React.useMemo(
    () => (enabled ? { reference, floating, trigger: reference } : {}),
    [enabled, reference, floating],
  );
}
