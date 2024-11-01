import * as React from 'react';
import type { GenericHTMLProps } from '../../utils/types';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useSelectRootContext } from '../SelectRoot';
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
    id,
    getRootPositionerProps,
    open,
    mounted,
    alignOptionToTrigger,
    triggerElement,
    positionerElement,
    valueRef,
    selectedOptionTextRef,
    popupRef,
  } = useSelectRootContext();

  const initialHeightRef = React.useRef(0);
  const deltaYRef = React.useRef(0);
  const reachedMaxHeightRef = React.useRef(false);
  const maxHeightRef = React.useRef(0);
  const initialPlacedRef = React.useRef(false);

  useEnhancedEffect(() => {
    if (mounted || !alignOptionToTrigger) {
      return;
    }

    initialPlacedRef.current = false;
    reachedMaxHeightRef.current = false;
    initialHeightRef.current = 0;
    maxHeightRef.current = 0;
    deltaYRef.current = 0;

    if (positionerElement) {
      Object.assign(positionerElement.style, {
        left: '',
        height: '',
        bottom: '',
        top: '',
        minHeight: '',
      });
    }
  }, [mounted, positionerElement, alignOptionToTrigger]);

  useEnhancedEffect(() => {
    if (
      !alignOptionToTrigger ||
      !open ||
      !triggerElement ||
      !positionerElement ||
      !popupRef.current
    ) {
      return;
    }

    const positionerStyles = getComputedStyle(positionerElement);
    const popupStyles = getComputedStyle(popupRef.current);

    const marginTop = parseFloat(positionerStyles.marginTop);
    const marginBottom = parseFloat(positionerStyles.marginBottom);
    const borderTop = parseFloat(popupStyles.borderTopWidth);
    const borderBottom = parseFloat(popupStyles.borderBottomWidth);
    const minHeight = parseFloat(positionerStyles.minHeight) || 100;

    const doc = ownerDocument(triggerElement);
    const triggerRect = triggerElement.getBoundingClientRect();
    const positionerRect = positionerElement.getBoundingClientRect();
    const triggerX = triggerRect.left;
    const triggerHeight = triggerRect.height;
    const viewportHeight = doc.documentElement.clientHeight - marginTop - marginBottom;
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

    positionerElement.style.left = `${triggerX + offsetX}px`;
    positionerElement.style.height = `${height}px`;
    positionerElement.style.minHeight = `${minHeight}px`;

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

    setTimeout(() => {
      initialPlacedRef.current = true;
    });
  }, [
    alignOptionToTrigger,
    open,
    positionerElement,
    triggerElement,
    valueRef,
    selectedOptionTextRef,
    popupRef,
  ]);

  const getPopupProps: useSelectPopup.ReturnValue['getPopupProps'] = React.useCallback(
    (externalProps = {}) => {
      return mergeReactProps<'div'>(getRootPositionerProps(externalProps), {
        ['data-id' as string]: id,
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
            deltaYRef.current += diff;
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
            deltaYRef.current += diff;
            const nextHeight = Math.min(currentHeight + diff, viewportHeight);
            const idealHeight = currentHeight + diff;
            const overshoot = idealHeight - viewportHeight;
            positionerElement.style.height = `${Math.min(idealHeight, viewportHeight)}px`;

            if (nextHeight !== viewportHeight) {
              event.currentTarget.scrollTop = 0;
            } else {
              event.currentTarget.scrollTop -= diff - overshoot;
              reachedMaxHeightRef.current = true;
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
