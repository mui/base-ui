import * as React from 'react';
import type { HTMLProps } from '../../utils/types';
import { useSelectRootContext } from '../root/SelectRootContext';
import { useLayoutEffect } from '../../utils/useLayoutEffect';
import { ownerDocument, ownerWindow } from '../../utils/owner';
import { useEventCallback } from '../../utils/useEventCallback';
import { clearPositionerStyles } from './utils';
import { isWebKit } from '../../utils/detectBrowser';
import { useSelectIndexContext } from '../root/SelectIndexContext';
import { isMouseWithinBounds } from '../../utils/isMouseWithinBounds';
import { useSelectPositionerContext } from '../positioner/SelectPositionerContext';

export function useSelectPopup(): useSelectPopup.ReturnValue {
  const {
    mounted,
    id,
    setOpen,
    triggerElement,
    positionerElement,
    valueRef,
    selectedItemTextRef,
    popupRef,
    scrollUpArrowVisible,
    scrollDownArrowVisible,
    setScrollUpArrowVisible,
    setScrollDownArrowVisible,
    keyboardActiveRef,
    floatingRootContext,
  } = useSelectRootContext();
  const { setActiveIndex } = useSelectIndexContext();
  const { alignItemWithTriggerActive, setControlledItemAnchor } = useSelectPositionerContext();

  const initialHeightRef = React.useRef(0);
  const reachedMaxHeightRef = React.useRef(false);
  const maxHeightRef = React.useRef(0);
  const initialPlacedRef = React.useRef(false);
  const originalPositionerStylesRef = React.useRef<React.CSSProperties>({});

  const handleScrollArrowVisibility = useEventCallback(() => {
    if (!alignItemWithTriggerActive || !popupRef.current) {
      return;
    }

    const isScrolledToTop = popupRef.current.scrollTop < 1;
    const isScrolledToBottom =
      popupRef.current.scrollTop + popupRef.current.clientHeight >=
      popupRef.current.scrollHeight - 1;

    if (scrollUpArrowVisible !== !isScrolledToTop) {
      setScrollUpArrowVisible(!isScrolledToTop);
    }
    if (scrollDownArrowVisible !== !isScrolledToBottom) {
      setScrollDownArrowVisible(!isScrolledToBottom);
    }
  });

  useLayoutEffect(() => {
    if (
      alignItemWithTriggerActive ||
      !positionerElement ||
      Object.keys(originalPositionerStylesRef.current).length
    ) {
      return;
    }

    originalPositionerStylesRef.current = {
      top: positionerElement.style.top || '0',
      left: positionerElement.style.left || '0',
      right: positionerElement.style.right,
      height: positionerElement.style.height,
      bottom: positionerElement.style.bottom,
      minHeight: positionerElement.style.minHeight,
      maxHeight: positionerElement.style.maxHeight,
      marginTop: positionerElement.style.marginTop,
      marginBottom: positionerElement.style.marginBottom,
    };
  }, [alignItemWithTriggerActive, positionerElement]);

  useLayoutEffect(() => {
    if (mounted || alignItemWithTriggerActive) {
      return;
    }

    initialPlacedRef.current = false;
    reachedMaxHeightRef.current = false;
    initialHeightRef.current = 0;
    maxHeightRef.current = 0;

    if (positionerElement) {
      clearPositionerStyles(positionerElement, originalPositionerStylesRef.current);
    }
  }, [mounted, alignItemWithTriggerActive, positionerElement]);

  useLayoutEffect(() => {
    if (
      !mounted ||
      !alignItemWithTriggerActive ||
      !triggerElement ||
      !positionerElement ||
      !popupRef.current
    ) {
      return;
    }

    const positionerStyles = getComputedStyle(positionerElement);
    const popupStyles = getComputedStyle(popupRef.current);

    const doc = ownerDocument(triggerElement);
    const win = ownerWindow(positionerElement);
    const triggerRect = triggerElement.getBoundingClientRect();
    const positionerRect = positionerElement.getBoundingClientRect();
    const triggerX = triggerRect.left;
    const triggerHeight = triggerRect.height;
    const scrollHeight = popupRef.current.scrollHeight;

    const borderBottom = parseFloat(popupStyles.borderBottomWidth);
    const marginTop = parseFloat(positionerStyles.marginTop) || 10;
    const marginBottom = parseFloat(positionerStyles.marginBottom) || 10;
    const minHeight = parseFloat(positionerStyles.minHeight) || 100;

    const paddingLeft = 5;
    const paddingRight = 5;
    const triggerCollisionThreshold = 20;

    const viewportHeight = doc.documentElement.clientHeight - marginTop - marginBottom;
    const viewportWidth = doc.documentElement.clientWidth;
    const availableSpaceBeneathTrigger = viewportHeight - triggerRect.bottom + triggerHeight;

    const textElement = selectedItemTextRef.current;
    const valueElement = valueRef.current;
    let offsetX = 0;
    let offsetY = 0;

    if (textElement && valueElement) {
      const valueRect = valueElement.getBoundingClientRect();
      const textRect = textElement.getBoundingClientRect();
      const valueLeftFromTriggerLeft = valueRect.left - triggerX;
      const textLeftFromPositionerLeft = textRect.left - positionerRect.left;
      const valueCenterFromPositionerTop = valueRect.top - triggerRect.top + valueRect.height / 2;
      const textCenterFromTriggerTop = textRect.top - positionerRect.top + textRect.height / 2;

      offsetX = valueLeftFromTriggerLeft - textLeftFromPositionerLeft;
      offsetY = textCenterFromTriggerTop - valueCenterFromPositionerTop;
    }

    const idealHeight = availableSpaceBeneathTrigger + offsetY + marginBottom + borderBottom;
    let height = Math.min(viewportHeight, idealHeight);
    const maxHeight = viewportHeight - marginTop - marginBottom;
    const scrollTop = idealHeight - height;

    const left = Math.max(paddingLeft, triggerX + offsetX);
    const maxRight = viewportWidth - paddingRight;
    const rightOverflow = Math.max(0, left + positionerRect.width - maxRight);

    positionerElement.style.left = `${left - rightOverflow}px`;
    positionerElement.style.height = `${height}px`;
    positionerElement.style.maxHeight = 'auto';
    positionerElement.style.marginTop = `${marginTop}px`;
    positionerElement.style.marginBottom = `${marginBottom}px`;

    const maxScrollTop = popupRef.current.scrollHeight - popupRef.current.clientHeight;
    const isTopPositioned = scrollTop >= maxScrollTop;

    if (isTopPositioned) {
      height = Math.min(viewportHeight, positionerRect.height) - (scrollTop - maxScrollTop);
    }

    // When the trigger is too close to the top or bottom of the viewport, or the minHeight is
    // reached, we fallback to aligning the popup to the trigger as the UX is poor otherwise.
    const fallbackToAlignPopupToTrigger =
      triggerRect.top < triggerCollisionThreshold ||
      triggerRect.bottom > viewportHeight - triggerCollisionThreshold ||
      height < Math.min(scrollHeight, minHeight);

    // Safari doesn't position the popup correctly when pinch-zoomed.
    const isPinchZoomed = (win.visualViewport?.scale ?? 1) !== 1 && isWebKit();

    if (fallbackToAlignPopupToTrigger || isPinchZoomed) {
      initialPlacedRef.current = true;
      clearPositionerStyles(positionerElement, originalPositionerStylesRef.current);
      setControlledItemAnchor(false);
      return;
    }

    if (isTopPositioned) {
      const topOffset = Math.max(0, viewportHeight - idealHeight);
      positionerElement.style.top = positionerRect.height >= maxHeight ? '0' : `${topOffset}px`;
      positionerElement.style.height = `${height}px`;
      popupRef.current.scrollTop = popupRef.current.scrollHeight - popupRef.current.clientHeight;
      initialHeightRef.current = Math.max(minHeight, height);
    } else {
      positionerElement.style.bottom = '0';
      initialHeightRef.current = Math.max(minHeight, height);
      popupRef.current.scrollTop = scrollTop;
    }

    if (initialHeightRef.current === viewportHeight) {
      reachedMaxHeightRef.current = true;
    }

    handleScrollArrowVisibility();

    // Avoid the `onScroll` event logic from triggering before the popup is placed.
    setTimeout(() => {
      initialPlacedRef.current = true;
    });
  }, [
    mounted,
    positionerElement,
    triggerElement,
    valueRef,
    selectedItemTextRef,
    popupRef,
    setScrollUpArrowVisible,
    setScrollDownArrowVisible,
    handleScrollArrowVisibility,
    alignItemWithTriggerActive,
    setControlledItemAnchor,
  ]);

  React.useEffect(() => {
    if (!alignItemWithTriggerActive || !positionerElement || !mounted) {
      return undefined;
    }

    const win = ownerWindow(positionerElement);

    function handleResize() {
      setOpen(false, undefined, undefined);
    }

    win.addEventListener('resize', handleResize);

    return () => {
      win.removeEventListener('resize', handleResize);
    };
  }, [setOpen, alignItemWithTriggerActive, positionerElement, mounted]);

  const props: HTMLProps = {
    ['data-id' as string]: `${id}-popup`,
    onKeyDown() {
      keyboardActiveRef.current = true;
    },
    onMouseMove() {
      keyboardActiveRef.current = false;
    },
    onMouseLeave(event) {
      if (isMouseWithinBounds(event)) {
        return;
      }
      setActiveIndex(null);
      event.currentTarget.focus({ preventScroll: true });
      floatingRootContext.events.emit('popupleave');
    },
    onScroll(event) {
      if (
        !alignItemWithTriggerActive ||
        !positionerElement ||
        !popupRef.current ||
        !initialPlacedRef.current
      ) {
        return;
      }

      if (reachedMaxHeightRef.current || !alignItemWithTriggerActive) {
        handleScrollArrowVisibility();
        return;
      }

      const isTopPositioned = positionerElement.style.top === '0px';
      const isBottomPositioned = positionerElement.style.bottom === '0px';
      const currentHeight = positionerElement.getBoundingClientRect().height;
      const doc = ownerDocument(positionerElement);
      const positionerStyles = getComputedStyle(positionerElement);
      const marginTop = parseFloat(positionerStyles.marginTop);
      const marginBottom = parseFloat(positionerStyles.marginBottom);
      const viewportHeight = doc.documentElement.clientHeight - marginTop - marginBottom;

      if (isTopPositioned) {
        const scrollTop = event.currentTarget.scrollTop;
        const maxScrollTop = event.currentTarget.scrollHeight - event.currentTarget.clientHeight;
        const diff = maxScrollTop - scrollTop;
        const nextHeight = Math.min(currentHeight + diff, viewportHeight);
        positionerElement.style.height = `${Math.min(currentHeight + diff, viewportHeight)}px`;

        if (nextHeight !== viewportHeight) {
          event.currentTarget.scrollTop = maxScrollTop;
        } else {
          reachedMaxHeightRef.current = true;
        }
      } else if (isBottomPositioned) {
        const scrollTop = event.currentTarget.scrollTop;
        const minScrollTop = 0;
        const diff = scrollTop - minScrollTop;
        const nextHeight = Math.min(currentHeight + diff, viewportHeight);
        const idealHeight = currentHeight + diff;
        const overshoot = idealHeight - viewportHeight;
        positionerElement.style.height = `${Math.min(idealHeight, viewportHeight)}px`;

        if (nextHeight !== viewportHeight) {
          event.currentTarget.scrollTop = 0;
        } else {
          reachedMaxHeightRef.current = true;
          if (
            event.currentTarget.scrollTop <
            event.currentTarget.scrollHeight - event.currentTarget.clientHeight
          ) {
            event.currentTarget.scrollTop -= diff - overshoot;
          }
        }
      }

      handleScrollArrowVisibility();
    },
    ...(alignItemWithTriggerActive && {
      style: {
        position: 'relative',
        maxHeight: '100%',
        overflowX: 'hidden',
        overflowY: 'auto',
      },
    }),
  };

  return {
    props,
  };
}

export namespace useSelectPopup {
  export interface ReturnValue {
    props: HTMLProps;
  }
}
