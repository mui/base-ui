'use client';
import * as React from 'react';
import { InteractionType } from '@base-ui/utils/useEnhancedClickHandler';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { getComputedStyle, isHTMLElement } from '@floating-ui/utils/dom';
import { FloatingFocusManager } from '../../floating-ui-react';
import { useDialogRootContext } from '../../dialog/root/DialogRootContext';
import { useSwipeDismiss } from '../../utils/useSwipeDismiss';
import { useRenderElement } from '../../utils/useRenderElement';
import type { BaseUIComponentProps } from '../../utils/types';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import type { StateAttributesMapping } from '../../utils/getStateAttributesProps';
import { popupStateMapping as baseMapping } from '../../utils/popupStateMapping';
import { transitionStatusMapping } from '../../utils/stateAttributesMapping';
import { DrawerPopupCssVars } from './DrawerPopupCssVars';
import { DrawerPopupDataAttributes } from './DrawerPopupDataAttributes';
import { createChangeEventDetails } from '../../utils/createBaseUIEventDetails';
import { REASONS } from '../../utils/reasons';
import { useDialogPortalContext } from '../../dialog/portal/DialogPortalContext';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { COMPOSITE_KEYS } from '../../composite/composite';
import { useDrawerRootContext, type DrawerSwipeDirection } from '../root/DrawerRootContext';
import { contains, getTarget } from '../../floating-ui-react/utils';

const stateAttributesMapping: StateAttributesMapping<DrawerPopup.State> = {
  ...baseMapping,
  ...transitionStatusMapping,
  nestedDrawerOpen(value) {
    return value ? { [DrawerPopupDataAttributes.nestedDrawerOpen]: '' } : null;
  },
  swipeDirection(value) {
    return value ? { [DrawerPopupDataAttributes.swipeDirection]: value } : null;
  },
  swiping(value) {
    return value ? { [DrawerPopupDataAttributes.swiping]: '' } : null;
  },
};

/**
 * A container for the drawer contents.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Drawer](https://base-ui.com/react/components/drawer)
 */
export const DrawerPopup = React.forwardRef(function DrawerPopup(
  componentProps: DrawerPopup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, finalFocus, initialFocus, render, ...elementProps } = componentProps;

  const { store } = useDialogRootContext();

  const { swipeDirection, frontmostHeight, onPopupHeightChange, notifyParentFrontmostHeight } =
    useDrawerRootContext();

  const descriptionElementId = store.useState('descriptionElementId');
  const disablePointerDismissal = store.useState('disablePointerDismissal');
  const floatingRootContext = store.useState('floatingRootContext');
  const rootPopupProps = store.useState('popupProps');
  const modal = store.useState('modal');
  const mounted = store.useState('mounted');
  const nested = store.useState('nested');
  const nestedOpenDialogCount = store.useState('nestedOpenDialogCount');
  const transitionStatus = store.useState('transitionStatus');
  const open = store.useState('open');
  const openMethod = store.useState('openMethod');
  const titleElementId = store.useState('titleElementId');
  const role = store.useState('role');
  const viewportElement = store.useState('viewportElement');

  const nestedDrawerOpen = nestedOpenDialogCount > 0;

  useDialogPortalContext();

  const [popupHeight, setPopupHeight] = React.useState(0);
  const popupHeightRef = React.useRef(0);
  const nestedOpenDialogCountRef = React.useRef(nestedOpenDialogCount);

  const measureHeight = useStableCallback(() => {
    const popupElement = store.context.popupRef.current;
    if (!popupElement) {
      return;
    }

    const offsetHeight = popupElement.offsetHeight;

    nestedOpenDialogCountRef.current = nestedOpenDialogCount;

    // Only skip while the element is still actually stretched beyond its last measured height.
    if (
      popupHeightRef.current > 0 &&
      frontmostHeight > popupHeightRef.current &&
      offsetHeight > popupHeightRef.current
    ) {
      return;
    }

    const wasNested = popupHeightRef.current > 0 && !nestedDrawerOpen;
    if (wasNested) {
      const oldHeight = popupHeightRef.current;
      setPopupHeight(oldHeight);
      onPopupHeightChange(oldHeight);
      return;
    }

    const scrollHeight = popupElement.scrollHeight;
    const nextHeight = scrollHeight > 0 ? Math.min(offsetHeight, scrollHeight) : offsetHeight;
    if (nextHeight === popupHeightRef.current) {
      return;
    }

    popupHeightRef.current = nextHeight;
    setPopupHeight(nextHeight);
    onPopupHeightChange(nextHeight);
  });

  useIsoLayoutEffect(() => {
    if (!mounted) {
      popupHeightRef.current = 0;
      setPopupHeight(0);
      onPopupHeightChange(0);
      return undefined;
    }

    const popupElement = store.context.popupRef.current;
    if (!popupElement) {
      return undefined;
    }

    measureHeight();

    if (typeof ResizeObserver !== 'function') {
      return undefined;
    }

    const resizeObserver = new ResizeObserver(measureHeight);

    resizeObserver.observe(popupElement);
    return () => {
      resizeObserver.disconnect();
    };
  }, [measureHeight, mounted, nestedDrawerOpen, onPopupHeightChange, store.context.popupRef]);

  React.useEffect(() => {
    if (!open) {
      return undefined;
    }

    notifyParentFrontmostHeight?.(frontmostHeight);

    return () => {
      notifyParentFrontmostHeight?.(0);
    };
  }, [frontmostHeight, open, notifyParentFrontmostHeight]);

  useOpenChangeComplete({
    open,
    ref: store.context.popupRef,
    onComplete() {
      if (open) {
        store.context.onOpenChangeComplete?.(true);
      }
    },
  });

  // Default initial focus logic:
  // If opened by touch, focus the popup element to prevent the virtual keyboard from opening
  // (this is required for Android specifically as iOS handles this automatically).
  function defaultInitialFocus(interactionType: InteractionType) {
    if (interactionType === 'touch') {
      return store.context.popupRef.current;
    }
    return true;
  }

  const resolvedInitialFocus = initialFocus === undefined ? defaultInitialFocus : initialFocus;

  const swipe = useSwipeDismiss({
    enabled: mounted && !nestedDrawerOpen,
    directions: [swipeDirection],
    elementRef: store.context.popupRef,
    movementCssVars: {
      x: DrawerPopupCssVars.swipeMovementX,
      y: DrawerPopupCssVars.swipeMovementY,
    },
    ignoreScrollableAncestors: true,
    onDismiss(_direction, event) {
      store.setOpen(false, createChangeEventDetails(REASONS.swipe, event));
    },
  });

  const resetSwipe = swipe.reset;
  const swipePointerProps = swipe.getPointerProps();

  React.useEffect(() => {
    if (open) {
      resetSwipe();
    }
  }, [open, resetSwipe]);

  const handlePointerDown = useStableCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!open || !mounted) {
      return;
    }

    if (nestedDrawerOpen) {
      return;
    }

    // When the drawer lives inside a scrollable viewport (e.g. <Drawer.Viewport />),
    // only allow swipe-to-dismiss when the scroll container is at the top.
    // Only gate touch/pen input; mouse dragging should still work even when a scrollable
    // container is at the top (mouse doesn't "scroll" via dragging the content).
    if (event.pointerType !== 'mouse' && swipeDirection === 'down') {
      const popupElement = event.currentTarget;
      const target = getTarget(event.nativeEvent);
      const targetElement = target instanceof Element ? target : null;
      const boundaryElement =
        viewportElement && contains(viewportElement, targetElement)
          ? viewportElement
          : popupElement;
      const scrollElement = findScrollableTouchTarget(target, boundaryElement);

      if (scrollElement && scrollElement.scrollTop > 0) {
        return;
      }
    }

    swipePointerProps.onPointerDown?.(event);
  });

  const handleTouchStart = useStableCallback((event: React.TouchEvent<HTMLDivElement>) => {
    if (!open || !mounted) {
      return;
    }

    if (nestedDrawerOpen) {
      return;
    }

    // iOS-style flick-to-dismiss via scroll "rubber banding" when the drawer is presented
    // as a bottom sheet (`swipeDirection="down"`).
    if (swipeDirection !== 'down') {
      return;
    }

    const popupElement = event.currentTarget;
    const target = getTarget(event.nativeEvent);
    const targetElement = target instanceof Element ? target : null;
    const boundaryElement =
      viewportElement && contains(viewportElement, targetElement) ? viewportElement : popupElement;
    const scrollElement = findScrollableTouchTarget(target, boundaryElement);

    // Only consider flicks from the scroll top (iOS does the same with its sheets).
    if (!scrollElement || scrollElement.scrollTop > 0) {
      return;
    }

    const startTouch = event.touches[0];
    const startY = startTouch?.clientY;
    const startTime = typeof startY === 'number' ? performance.now() : undefined;
    let lastTouchY = startY;

    function handleTouchMove(nativeEvent: TouchEvent) {
      const touch = nativeEvent.touches[0];
      if (!touch) {
        return;
      }

      lastTouchY = touch.clientY;
    }

    scrollElement.addEventListener('touchmove', handleTouchMove, { passive: true });

    function cleanup() {
      scrollElement?.removeEventListener('touchmove', handleTouchMove);
    }

    scrollElement.addEventListener(
      'touchend',
      function handleTouchEnd(nativeEvent) {
        cleanup();

        const endTouchY = nativeEvent.changedTouches[0]?.clientY ?? lastTouchY;
        const endTouchTime = performance.now();
        const deltaY =
          typeof startY === 'number' && typeof endTouchY === 'number' ? endTouchY - startY : 0;
        const durationMs =
          typeof startTime === 'number' ? Math.max(endTouchTime - startTime, 1) : 0;
        const velocity = durationMs > 0 ? deltaY / durationMs : 0;

        // If touch ended and we are overscrolling past a threshold...
        if (scrollElement.scrollTop < -32) {
          const y = scrollElement.scrollTop;

          scrollElement.addEventListener(
            'scroll',
            function handleNextScroll() {
              // ...look at whether the system's intertia scrolling is continuing the motion
              // in the same direction. If so, the flick is strong enough to close the drawer.
              if (scrollElement.scrollTop < y) {
                store.setOpen(false, createChangeEventDetails(REASONS.swipe, nativeEvent));
              } else if (scrollElement.scrollTop === y) {
                // Sometimes the first scroll event comes with the same scroll position.
                // If so, give it another chance, call ourselves recursively.
                scrollElement.addEventListener('scroll', handleNextScroll, { once: true });
              }
            },
            { once: true },
          );
        } else if (
          // Some browsers (e.g. Android Chrome) don't report negative `scrollTop` during overscroll.
          // Fall back to a touch flick heuristic when we're at the top.
          scrollElement.scrollTop <= 0 &&
          deltaY > 32 &&
          velocity > 0.35
        ) {
          store.setOpen(false, createChangeEventDetails(REASONS.swipe, nativeEvent));
        }
      },
      { once: true },
    );

    scrollElement.addEventListener(
      'touchcancel',
      function handleTouchCancel() {
        cleanup();
      },
      { once: true },
    );
  });

  const state: DrawerPopup.State = React.useMemo(
    () => ({
      open,
      nested,
      transitionStatus,
      nestedDrawerOpen,
      swipeDirection,
      swiping: swipe.swiping,
    }),
    [nested, nestedDrawerOpen, open, swipe.swiping, swipeDirection, transitionStatus],
  );

  let popupHeightCssVarValue: string | undefined;
  if (popupHeight) {
    popupHeightCssVarValue = `${popupHeight}px`;
  }

  const element = useRenderElement('div', componentProps, {
    state,
    props: [
      rootPopupProps,
      {
        'aria-labelledby': titleElementId,
        'aria-describedby': descriptionElementId,
        role,
        tabIndex: -1,
        hidden: !mounted,
        onPointerDown: handlePointerDown,
        onPointerMove: swipePointerProps.onPointerMove,
        onPointerUp: swipePointerProps.onPointerUp,
        onTouchStart: handleTouchStart,
        onKeyDown(event: React.KeyboardEvent) {
          if (COMPOSITE_KEYS.has(event.key)) {
            event.stopPropagation();
          }
        },
        style: {
          ...swipe.getDragStyles(),
          [DrawerPopupCssVars.nestedDrawers]: nestedOpenDialogCount,
          [DrawerPopupCssVars.height]: popupHeightCssVarValue,
          [DrawerPopupCssVars.frontmostHeight]: frontmostHeight
            ? `${frontmostHeight}px`
            : undefined,
        } as React.CSSProperties,
      },
      elementProps,
    ],
    ref: [forwardedRef, store.context.popupRef, store.useStateSetter('popupElement')],
    stateAttributesMapping,
  });

  return (
    <FloatingFocusManager
      context={floatingRootContext}
      openInteractionType={openMethod}
      disabled={!mounted}
      closeOnFocusOut={!disablePointerDismissal}
      initialFocus={resolvedInitialFocus}
      returnFocus={finalFocus}
      modal={modal !== false}
      restoreFocus="popup"
    >
      {element}
    </FloatingFocusManager>
  );
});

export interface DrawerPopupProps extends BaseUIComponentProps<'div', DrawerPopup.State> {
  /**
   * Determines the element to focus when the drawer is opened.
   *
   * - `false`: Do not move focus.
   * - `true`: Move focus based on the default behavior (first tabbable element or popup).
   * - `RefObject`: Move focus to the ref element.
   * - `function`: Called with the interaction type (`mouse`, `touch`, `pen`, or `keyboard`).
   *   Return an element to focus, `true` to use the default behavior, or `false`/`undefined` to do nothing.
   */
  initialFocus?:
    | boolean
    | React.RefObject<HTMLElement | null>
    | ((openType: InteractionType) => boolean | HTMLElement | null | void);
  /**
   * Determines the element to focus when the drawer is closed.
   *
   * - `false`: Do not move focus.
   * - `true`: Move focus based on the default behavior (trigger or previously focused element).
   * - `RefObject`: Move focus to the ref element.
   * - `function`: Called with the interaction type (`mouse`, `touch`, `pen`, or `keyboard`).
   *   Return an element to focus, `true` to use the default behavior, or `false`/`undefined` to do nothing.
   */
  finalFocus?:
    | boolean
    | React.RefObject<HTMLElement | null>
    | ((closeType: InteractionType) => boolean | HTMLElement | null | void);
}

export interface DrawerPopupState {
  /**
   * Whether the drawer is currently open.
   */
  open: boolean;
  transitionStatus: TransitionStatus;
  /**
   * Whether the drawer is nested within a parent drawer.
   */
  nested: boolean;
  /**
   * Whether the drawer has nested drawers open.
   */
  nestedDrawerOpen: boolean;
  /**
   * The swipe direction used to dismiss the drawer.
   */
  swipeDirection: DrawerSwipeDirection;
  /**
   * Whether the drawer is being swiped.
   */
  swiping: boolean;
}

export namespace DrawerPopup {
  export type Props = DrawerPopupProps;
  export type State = DrawerPopupState;
}

function findScrollableTouchTarget(
  target: EventTarget | null,
  root: HTMLElement,
): HTMLElement | null {
  let node = isHTMLElement(target) ? target : null;
  while (node && node !== root) {
    const style = getComputedStyle(node);
    const overflowY = style.overflowY;
    if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight) {
      return node;
    }
    node = node.parentElement;
  }

  const rootStyle = getComputedStyle(root);
  const rootOverflowY = rootStyle.overflowY;
  if (
    (rootOverflowY === 'auto' || rootOverflowY === 'scroll') &&
    root.scrollHeight > root.clientHeight
  ) {
    return root;
  }

  return null;
}
