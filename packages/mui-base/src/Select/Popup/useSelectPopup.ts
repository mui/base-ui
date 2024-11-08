import * as React from 'react';
import type { GenericHTMLProps } from '../../utils/types';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useSelectRootContext } from '../Root/SelectRootContext';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { ownerDocument } from '../../utils/owner';
import { useEventCallback } from '../../utils/useEventCallback';

function clearPositionerStyles(
  positionerElement: HTMLElement,
  originalPositionerStyles: React.CSSProperties,
) {
  Object.assign(positionerElement.style, originalPositionerStyles);
}

/**
 *
 * API:
 *
 * - [useSelectPopup API](https://mui.com/base-ui/api/use-select-popup/)
 */
export function useSelectPopup(): useSelectPopup.ReturnValue {
  const {
    mounted,
    id,
    setOpen,
    getRootPositionerProps,
    alignOptionToTrigger,
    alignOptionToTriggerRaw,
    triggerElement,
    positionerElement,
    valueRef,
    selectedOptionTextRef,
    popupRef,
    setScrollUpArrowVisible,
    setScrollDownArrowVisible,
    setControlledAlignOptionToTrigger,
  } = useSelectRootContext();

  const initialHeightRef = React.useRef(0);
  const reachedMaxHeightRef = React.useRef(false);
  const maxHeightRef = React.useRef(0);
  const initialPlacedRef = React.useRef(false);
  const originalPositionerStyles = React.useRef<React.CSSProperties>({});

  const handleScrollArrowVisibility = useEventCallback(() => {
    if (!alignOptionToTriggerRaw || !popupRef.current) {
      return;
    }

    const isScrolledToTop = popupRef.current.scrollTop < 1;
    const isScrolledToBottom =
      popupRef.current.scrollTop + popupRef.current.clientHeight >=
      popupRef.current.scrollHeight - 1;

    setScrollUpArrowVisible(!isScrolledToTop);
    setScrollDownArrowVisible(!isScrolledToBottom);
  });

  useEnhancedEffect(() => {
    if (!mounted || !positionerElement || Object.keys(originalPositionerStyles.current).length) {
      return;
    }

    originalPositionerStyles.current = {
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
  }, [mounted, positionerElement]);

  useEnhancedEffect(() => {
    if (mounted || alignOptionToTrigger) {
      return;
    }

    initialPlacedRef.current = false;
    reachedMaxHeightRef.current = false;
    initialHeightRef.current = 0;
    maxHeightRef.current = 0;

    if (positionerElement) {
      clearPositionerStyles(positionerElement, originalPositionerStyles.current);
    }
  }, [mounted, alignOptionToTrigger, positionerElement]);

  useEnhancedEffect(() => {
    if (mounted && !alignOptionToTrigger && alignOptionToTriggerRaw) {
      requestAnimationFrame(handleScrollArrowVisibility);
    }
  }, [mounted, alignOptionToTrigger, alignOptionToTriggerRaw, handleScrollArrowVisibility]);

  useEnhancedEffect(() => {
    if (!alignOptionToTrigger || !triggerElement || !positionerElement || !popupRef.current) {
      return;
    }

    const positionerStyles = getComputedStyle(positionerElement);
    const popupStyles = getComputedStyle(popupRef.current);

    const borderBottom = parseFloat(popupStyles.borderBottomWidth);
    const marginTop = parseFloat(positionerStyles.marginTop) || 10;
    const marginBottom = parseFloat(positionerStyles.marginBottom) || 10;
    const minHeight = parseFloat(positionerStyles.minHeight) || 100;

    const doc = ownerDocument(triggerElement);
    const triggerRect = triggerElement.getBoundingClientRect();
    const positionerRect = positionerElement.getBoundingClientRect();
    const triggerX = triggerRect.left;
    const triggerHeight = triggerRect.height;
    const viewportHeight = doc.documentElement.clientHeight - marginTop - marginBottom;
    const viewportWidth = doc.documentElement.clientWidth;
    const availableSpaceBeneathTrigger = viewportHeight - triggerRect.bottom + triggerHeight;

    const optionTextElement = selectedOptionTextRef.current;
    const valueElement = valueRef.current;
    let offsetX = 0;
    let offsetY = 0;

    if (optionTextElement && valueElement) {
      const valueRect = valueElement.getBoundingClientRect();
      const textRect = optionTextElement.getBoundingClientRect();

      const triggerXDiff = valueRect.left - triggerX;
      const popupXDiff = textRect.left - positionerRect.left;

      offsetX = triggerXDiff - popupXDiff;
      offsetY = optionTextElement.offsetTop - (valueRect.top - triggerRect.top);
    }

    const idealHeight = availableSpaceBeneathTrigger + offsetY + marginBottom + borderBottom;
    let height = Math.min(viewportHeight, idealHeight);
    const maxHeight = viewportHeight - marginTop - marginBottom;
    const scrollTop = idealHeight - height;

    const left = Math.max(10, triggerX + offsetX);
    const maxRight = viewportWidth - 10;
    const rightOverflow = Math.max(0, left + positionerRect.width - maxRight);

    positionerElement.style.left = `${left - rightOverflow}px`;
    positionerElement.style.height = `${height}px`;
    positionerElement.style.minHeight = `${minHeight}px`;
    positionerElement.style.maxHeight = 'auto';
    positionerElement.style.marginTop = `${marginTop}px`;
    positionerElement.style.marginBottom = `${marginBottom}px`;

    const maxScrollTop = popupRef.current.scrollHeight - popupRef.current.clientHeight;
    const isTopPositioned = scrollTop >= maxScrollTop;

    if (isTopPositioned) {
      height = Math.min(viewportHeight, positionerRect.height) - (scrollTop - maxScrollTop);
    }

    // When the reference is too close to the top or bottom of the viewport, or the minHeight is
    // reached, we fallback to aligning the popup to the trigger as the UX is poor otherwise.
    const fallbackToAlignPopupToTrigger =
      triggerRect.top < 30 || triggerRect.bottom > viewportHeight - 30 || height < minHeight;

    if (fallbackToAlignPopupToTrigger) {
      initialPlacedRef.current = true;
      clearPositionerStyles(positionerElement, originalPositionerStyles.current);
      setControlledAlignOptionToTrigger(false);
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
    alignOptionToTrigger,
    positionerElement,
    triggerElement,
    valueRef,
    selectedOptionTextRef,
    popupRef,
    setScrollUpArrowVisible,
    setScrollDownArrowVisible,
    handleScrollArrowVisibility,
    setControlledAlignOptionToTrigger,
  ]);

  React.useEffect(() => {
    if (!alignOptionToTrigger || !positionerElement || !mounted) {
      return undefined;
    }

    const win = ownerDocument(positionerElement).defaultView || window;

    function handleResize() {
      setOpen(false);
    }

    win.addEventListener('resize', handleResize);

    return () => {
      win.removeEventListener('resize', handleResize);
    };
  }, [setOpen, alignOptionToTrigger, positionerElement, mounted]);

  const getPopupProps: useSelectPopup.ReturnValue['getPopupProps'] = React.useCallback(
    (externalProps = {}) => {
      return mergeReactProps<'div'>(getRootPositionerProps(externalProps), {
        ['data-id' as string]: `${id}-popup`,
        onScroll(event) {
          if (
            !alignOptionToTriggerRaw ||
            !positionerElement ||
            !popupRef.current ||
            !initialPlacedRef.current
          ) {
            return;
          }

          if (reachedMaxHeightRef.current || !alignOptionToTrigger) {
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
            const maxScrollTop =
              event.currentTarget.scrollHeight - event.currentTarget.clientHeight;
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
        style: {
          ...(alignOptionToTrigger && {
            position: 'relative',
            maxHeight: '100%',
            overflowX: 'hidden',
            overflowY: 'auto',
          }),
          outline: '0',
        },
      });
    },
    [
      getRootPositionerProps,
      id,
      alignOptionToTrigger,
      alignOptionToTriggerRaw,
      positionerElement,
      popupRef,
      handleScrollArrowVisibility,
    ],
  );

  return React.useMemo(
    () => ({
      getPopupProps,
    }),
    [getPopupProps],
  );
}

namespace useSelectPopup {
  export interface ReturnValue {
    getPopupProps: (props?: GenericHTMLProps) => GenericHTMLProps;
  }
}
