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
import { Timeout, useTimeout } from '@base-ui/utils/useTimeout';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
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
import { FloatingTreeStore } from '../components/FloatingTreeStore';
import type { ElementProps, FloatingContext, FloatingRootContext } from '../types';
import { createChangeEventDetails } from '../../utils/createBaseUIEventDetails';
import { REASONS } from '../../utils/reasons';
import { createAttribute } from '../utils/createAttribute';

type PressType = 'intentional' | 'sloppy';

const bubbleHandlerKeys = {
  intentional: 'onClick',
  sloppy: 'onPointerDown',
} as const;

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
   * @default false
   */
  referencePress?: boolean | undefined;
  /**
   * The type of event to use to determine a "press".
   * - `down` is `pointerdown` on mouse input, but special iOS-like touch handling on touch input.
   * - `up` is lazy on both mouse + touch input (equivalent to `click`).
   * @default 'down'
   */
  referencePressEvent?: PressType | undefined;
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
  outsidePress?: (boolean | ((event: MouseEvent | TouchEvent) => boolean)) | undefined;
  /**
   * The type of event to use to determine an outside "press".
   * - `intentional` requires the user to click outside intentionally, firing on `pointerup` for mouse, and requiring minimal `touchmove`s for touch.
   * - `sloppy` fires on `pointerdown` for mouse, while for touch it fires on `touchend` (within 1 second) or while scrolling away after `touchstart`.
   */
  outsidePressEvent?:
    | (
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
      )
    | undefined;
  /**
   * Whether to dismiss the floating element upon scrolling an overflow
   * ancestor.
   * @default false
   */
  ancestorScroll?: boolean | undefined;
  /**
   * Determines whether event listeners bubble upwards through a tree of
   * floating elements.
   */
  bubbles?:
    | (boolean | { escapeKey?: boolean | undefined; outsidePress?: boolean | undefined })
    | undefined;
  /**
   * External FlatingTree to use when the one provided by context can't be used.
   */
  externalTree?: FloatingTreeStore | undefined;
}

/**
 * Closes the floating element when a dismissal is requested — by default, when
 * the user presses the `escape` key or outside of the floating element.
 * @see https://floating-ui.com/docs/useDismiss
 */
export function useDismiss(
  context: FloatingRootContext | FloatingContext,
  props: UseDismissProps = {},
): ElementProps {
  const store = 'rootStore' in context ? context.rootStore : context;
  const open = store.useState('open');
  const floatingElement = store.useState('floatingElement');
  const referenceElement = store.useState('referenceElement');
  const domReferenceElement = store.useState('domReferenceElement');

  const { onOpenChange, dataRef } = store.context;

  const {
    enabled = true,
    escapeKey = true,
    outsidePress: outsidePressProp = true,
    outsidePressEvent = 'sloppy',
    referencePress = false,
    referencePressEvent = 'sloppy',
    ancestorScroll = false,
    bubbles,
    externalTree,
  } = props;

  const tree = useFloatingTree(externalTree);
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
      const eventDetails = createChangeEventDetails(REASONS.escapeKey, native);

      store.setOpen(false, eventDetails);

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
      const markers = getDocument(store.select('floatingElement')).querySelectorAll(inertSelector);

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
        isEventTargetWithin(event, store.select('floatingElement')) ||
        isEventTargetWithin(event, store.select('domReferenceElement')) ||
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

      store.setOpen(false, createChangeEventDetails(REASONS.outsidePress, event));
      clearInsideReactTree();
    },
  );

  const handlePointerDown = useStableCallback((event: PointerEvent) => {
    if (
      getOutsidePressEvent() !== 'sloppy' ||
      event.pointerType === 'touch' ||
      !store.select('open') ||
      !enabled ||
      isEventTargetWithin(event, store.select('floatingElement')) ||
      isEventTargetWithin(event, store.select('domReferenceElement'))
    ) {
      return;
    }

    closeOnPressOutside(event);
  });

  const handleTouchStart = useStableCallback((event: TouchEvent) => {
    if (
      getOutsidePressEvent() !== 'sloppy' ||
      !store.select('open') ||
      !enabled ||
      isEventTargetWithin(event, store.select('floatingElement')) ||
      isEventTargetWithin(event, store.select('domReferenceElement'))
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
      isEventTargetWithin(event, store.select('floatingElement')) ||
      isEventTargetWithin(event, store.select('domReferenceElement'))
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
      isEventTargetWithin(event, store.select('floatingElement')) ||
      isEventTargetWithin(event, store.select('domReferenceElement'))
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
      store.setOpen(false, createChangeEventDetails(REASONS.none, event));
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

    const doc = getDocument(floatingElement);

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
      if (isElement(domReferenceElement)) {
        ancestors = getOverflowAncestors(domReferenceElement);
      }

      if (isElement(floatingElement)) {
        ancestors = ancestors.concat(getOverflowAncestors(floatingElement));
      }

      if (!isElement(referenceElement) && referenceElement && referenceElement.contextElement) {
        ancestors = ancestors.concat(getOverflowAncestors(referenceElement.contextElement));
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
      endedOrStartedInsideRef.current = false;
    };
  }, [
    dataRef,
    floatingElement,
    referenceElement,
    domReferenceElement,
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
    store,
  ]);

  React.useEffect(clearInsideReactTree, [outsidePress, clearInsideReactTree]);

  const reference: ElementProps['reference'] = React.useMemo(
    () => ({
      onKeyDown: closeOnEscapeKeyDown,
      ...(referencePress && {
        [bubbleHandlerKeys[referencePressEvent]]: (event: React.SyntheticEvent) => {
          store.setOpen(
            false,
            createChangeEventDetails(REASONS.triggerPress, event.nativeEvent as any),
          );
        },
        ...(referencePressEvent !== 'intentional' && {
          onClick(event) {
            store.setOpen(false, createChangeEventDetails(REASONS.triggerPress, event.nativeEvent));
          },
        }),
      }),
    }),
    [closeOnEscapeKeyDown, store, referencePress, referencePressEvent],
  );

  const handlePressedInside = useStableCallback((event: React.MouseEvent) => {
    const target = getTarget(event.nativeEvent) as Element | null;
    if (!contains(store.select('floatingElement'), target) || event.button !== 0) {
      return;
    }
    endedOrStartedInsideRef.current = true;
  });

  const markPressStartedInsideReactTree = useStableCallback(
    (event: React.PointerEvent | React.MouseEvent) => {
      if (!open || !enabled || event.button !== 0) {
        return;
      }
      endedOrStartedInsideRef.current = true;
    },
  );

  const floating: ElementProps['floating'] = React.useMemo(
    () => ({
      onKeyDown: closeOnEscapeKeyDown,

      // `onMouseDown` may be blocked if `event.preventDefault()` is called in
      // `onPointerDown`, such as with <NumberField.ScrubArea>.
      // See https://github.com/mui/base-ui/pull/3379
      onPointerDown: handlePressedInside,
      onMouseDown: handlePressedInside,
      onMouseUp: handlePressedInside,

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
      handlePressedInside,
      markInsideReactTree,
      markPressStartedInsideReactTree,
    ],
  );

  return React.useMemo(
    () => (enabled ? { reference, floating, trigger: reference } : {}),
    [enabled, reference, floating],
  );
}
