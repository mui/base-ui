import * as React from 'react';
import type { GenericHTMLProps } from '../../utils/types';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useSelectRootContext } from '../Root/SelectRootContext';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { ownerDocument } from '../../utils/owner';

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
    triggerElement,
    positionerElement,
    valueRef,
    selectedOptionTextRef,
    popupRef,
    setScrollUpArrowVisible,
    setScrollDownArrowVisible,
  } = useSelectRootContext();

  const initialHeightRef = React.useRef(0);
  const reachedMaxHeightRef = React.useRef(false);
  const maxHeightRef = React.useRef(0);
  const initialPlacedRef = React.useRef(false);

  useEnhancedEffect(() => {
    if (mounted) {
      return;
    }

    initialPlacedRef.current = false;
    reachedMaxHeightRef.current = false;
    initialHeightRef.current = 0;
    maxHeightRef.current = 0;

    if (positionerElement) {
      Object.assign(positionerElement.style, {
        top: '0',
        left: '0',
        right: '',
        height: '',
        bottom: '',
        minHeight: '',
      });
    }
  }, [mounted, positionerElement, alignOptionToTrigger]);

  useEnhancedEffect(() => {
    if (!alignOptionToTrigger || !triggerElement || !positionerElement || !popupRef.current) {
      return;
    }

    const positionerStyles = getComputedStyle(positionerElement);
    const popupStyles = getComputedStyle(popupRef.current);

    const marginTop = parseFloat(positionerStyles.marginTop);
    const marginBottom = parseFloat(positionerStyles.marginBottom);
    const borderBottom = parseFloat(popupStyles.borderBottomWidth);
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
    const height = Math.min(viewportHeight, idealHeight);
    const maxHeight = viewportHeight - marginTop - marginBottom;
    const scrollTop = idealHeight - height;

    const left = Math.max(10, triggerX + offsetX);
    const maxRight = viewportWidth - 10;

    positionerElement.style.left = `${left}px`;
    positionerElement.style.height = `${height}px`;
    positionerElement.style.minHeight = `${minHeight}px`;

    if (left + positionerRect.width > maxRight) {
      positionerElement.style.right = '10px';
    }

    const maxScrollTop = popupRef.current.scrollHeight - popupRef.current.clientHeight;
    const isTopPositioned = scrollTop >= maxScrollTop;

    if (isTopPositioned) {
      const topOffset = Math.max(0, viewportHeight - idealHeight);
      const topHeight =
        Math.min(viewportHeight, positionerRect.height) - (scrollTop - maxScrollTop);
      positionerElement.style.top = positionerRect.height >= maxHeight ? '0' : `${topOffset}px`;
      positionerElement.style.height = `${topHeight}px`;
      popupRef.current.scrollTop = popupRef.current.scrollHeight - popupRef.current.clientHeight;
      initialHeightRef.current = Math.max(minHeight, topHeight);
    } else {
      positionerElement.style.bottom = '0';
      initialHeightRef.current = Math.max(minHeight, height);
      popupRef.current.scrollTop = scrollTop;
    }

    if (initialHeightRef.current === viewportHeight) {
      reachedMaxHeightRef.current = true;
    }

    const isScrolledToTop = popupRef.current.scrollTop < 1;
    const isScrolledToBottom =
      Math.ceil(popupRef.current.scrollTop + popupRef.current.clientHeight) >=
      popupRef.current.scrollHeight - 1;

    setScrollUpArrowVisible(!isScrolledToTop);
    setScrollDownArrowVisible(!isScrolledToBottom);

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
            !alignOptionToTrigger ||
            !positionerElement ||
            !popupRef.current ||
            reachedMaxHeightRef.current ||
            !initialPlacedRef.current
          ) {
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
        },
        style: {
          ...(alignOptionToTrigger && {
            position: 'relative',
            maxHeight: '100%',
            overflow: 'hidden auto',
          }),
          outline: '0',
        },
      });
    },
    [id, alignOptionToTrigger, getRootPositionerProps, popupRef, positionerElement],
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
