'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { isWebKit } from '@base-ui-components/utils/detectBrowser';
import { ownerDocument, ownerWindow } from '@base-ui-components/utils/owner';
import { isMouseWithinBounds } from '@base-ui-components/utils/isMouseWithinBounds';
import { useIsoLayoutEffect } from '@base-ui-components/utils/useIsoLayoutEffect';
import { useEventCallback } from '@base-ui-components/utils/useEventCallback';
import { useStore } from '@base-ui-components/utils/store';
import { FloatingFocusManager } from '../../floating-ui-react';
import type { BaseUIComponentProps, HTMLProps } from '../../utils/types';
import { useSelectRootContext } from '../root/SelectRootContext';
import { popupStateMapping } from '../../utils/popupStateMapping';
import type { Side, Align } from '../../utils/useAnchorPositioning';
import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import { useSelectPositionerContext } from '../positioner/SelectPositionerContext';
import { styleDisableScrollbar } from '../../utils/styles';
import { transitionStatusMapping } from '../../utils/styleHookMapping';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { useRenderElement } from '../../utils/useRenderElement';
import { selectors } from '../store';
import { clearPositionerStyles } from './utils';
import { DISABLED_TRANSITIONS_STYLE } from '../../utils/constants';
import { createBaseUIEventData } from '../../utils/createBaseUIEvent';

const customStyleHookMapping: CustomStyleHookMapping<SelectPopup.State> = {
  ...popupStateMapping,
  ...transitionStatusMapping,
};

/**
 * A container for the select items.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export const SelectPopup = React.forwardRef(function SelectPopup(
  componentProps: SelectPopup.Props,
  forwardedRef: React.ForwardedRef<Element>,
) {
  const { render, className, ...elementProps } = componentProps;

  const {
    store,
    popupRef,
    onOpenChangeComplete,
    setOpen,
    valueRef,
    selectedItemTextRef,
    keyboardActiveRef,
    highlightTimeout,
    multiple,
  } = useSelectRootContext();
  const { side, align, context, alignItemWithTriggerActive, setControlledAlignItemWithTrigger } =
    useSelectPositionerContext();

  const open = useStore(store, selectors.open);
  const mounted = useStore(store, selectors.mounted);
  const popupProps = useStore(store, selectors.popupProps);
  const transitionStatus = useStore(store, selectors.transitionStatus);
  const triggerElement = useStore(store, selectors.triggerElement);
  const positionerElement = useStore(store, selectors.positionerElement);
  const scrollUpArrowVisible = useStore(store, selectors.scrollUpArrowVisible);
  const scrollDownArrowVisible = useStore(store, selectors.scrollDownArrowVisible);

  useOpenChangeComplete({
    open,
    ref: popupRef,
    onComplete() {
      if (open) {
        onOpenChangeComplete?.(true);
      }
    },
  });

  const state: SelectPopup.State = React.useMemo(
    () => ({
      open,
      transitionStatus,
      side,
      align,
    }),
    [open, transitionStatus, side, align],
  );

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
      store.set('scrollUpArrowVisible', !isScrolledToTop);
    }
    if (scrollDownArrowVisible !== !isScrolledToBottom) {
      store.set('scrollDownArrowVisible', !isScrolledToBottom);
    }
  });

  useIsoLayoutEffect(() => {
    if (!positionerElement || Object.keys(originalPositionerStylesRef.current).length) {
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
  }, [positionerElement]);

  useIsoLayoutEffect(() => {
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

  useIsoLayoutEffect(() => {
    const popupElement = popupRef.current;

    if (
      !mounted ||
      !alignItemWithTriggerActive ||
      !triggerElement ||
      !positionerElement ||
      !popupRef.current ||
      !popupElement
    ) {
      return;
    }

    // Wait for `selectedItemTextRef.current` to be set.
    queueMicrotask(() => {
      const positionerStyles = getComputedStyle(positionerElement);
      const popupStyles = getComputedStyle(popupElement);

      const doc = ownerDocument(triggerElement);
      const win = ownerWindow(positionerElement);
      const triggerRect = triggerElement.getBoundingClientRect();
      const positionerRect = positionerElement.getBoundingClientRect();
      const triggerX = triggerRect.left;
      const triggerHeight = triggerRect.height;
      const scrollHeight = popupElement.scrollHeight;

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

      const maxScrollTop = popupElement.scrollHeight - popupElement.clientHeight;
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
      const isPinchZoomed = (win.visualViewport?.scale ?? 1) !== 1 && isWebKit;

      if (fallbackToAlignPopupToTrigger || isPinchZoomed) {
        initialPlacedRef.current = true;
        clearPositionerStyles(positionerElement, originalPositionerStylesRef.current);
        ReactDOM.flushSync(() => setControlledAlignItemWithTrigger(false));
        return;
      }

      if (isTopPositioned) {
        const topOffset = Math.max(0, viewportHeight - idealHeight);
        positionerElement.style.top = positionerRect.height >= maxHeight ? '0' : `${topOffset}px`;
        positionerElement.style.height = `${height}px`;
        popupElement.scrollTop = popupElement.scrollHeight - popupElement.clientHeight;
        initialHeightRef.current = Math.max(minHeight, height);
      } else {
        positionerElement.style.bottom = '0';
        initialHeightRef.current = Math.max(minHeight, height);
        popupElement.scrollTop = scrollTop;
      }

      if (initialHeightRef.current === viewportHeight) {
        reachedMaxHeightRef.current = true;
      }

      handleScrollArrowVisibility();

      // Avoid the `onScroll` event logic from triggering before the popup is placed.
      setTimeout(() => {
        initialPlacedRef.current = true;
      });
    });
  }, [
    store,
    mounted,
    positionerElement,
    triggerElement,
    valueRef,
    selectedItemTextRef,
    popupRef,
    handleScrollArrowVisibility,
    alignItemWithTriggerActive,
    setControlledAlignItemWithTrigger,
  ]);

  React.useEffect(() => {
    if (!alignItemWithTriggerActive || !positionerElement || !mounted) {
      return undefined;
    }

    const win = ownerWindow(positionerElement);

    function handleResize(event: Event) {
      setOpen(false, event, createBaseUIEventData('window-resize'));
    }

    win.addEventListener('resize', handleResize);

    return () => {
      win.removeEventListener('resize', handleResize);
    };
  }, [setOpen, alignItemWithTriggerActive, positionerElement, mounted]);

  const defaultProps: HTMLProps = {
    'aria-multiselectable': multiple || undefined,
    onKeyDown() {
      keyboardActiveRef.current = true;
    },
    onMouseMove() {
      keyboardActiveRef.current = false;
    },
    onPointerLeave(event) {
      if (isMouseWithinBounds(event) || event.pointerType === 'touch') {
        return;
      }

      const popup = event.currentTarget;

      highlightTimeout.start(0, () => {
        store.set('activeIndex', null);
        popup.focus({ preventScroll: true });
      });
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

      if (reachedMaxHeightRef.current) {
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

  const element = useRenderElement('div', componentProps, {
    ref: [forwardedRef, popupRef],
    state,
    customStyleHookMapping,
    props: [
      popupProps,
      defaultProps,
      {
        style: transitionStatus === 'starting' ? DISABLED_TRANSITIONS_STYLE.style : undefined,
        className: alignItemWithTriggerActive ? styleDisableScrollbar.className : undefined,
      },
      elementProps,
    ],
  });

  return (
    <React.Fragment>
      {styleDisableScrollbar.element}
      <FloatingFocusManager context={context} modal={false} disabled={!mounted} restoreFocus>
        {element}
      </FloatingFocusManager>
    </React.Fragment>
  );
});

export namespace SelectPopup {
  export interface Props extends BaseUIComponentProps<'div', State> {
    children?: React.ReactNode;
    /**
     * @ignore
     */
    id?: string;
  }

  export interface State {
    side: Side | 'none';
    align: Align;
    open: boolean;
    transitionStatus: TransitionStatus;
  }
}
