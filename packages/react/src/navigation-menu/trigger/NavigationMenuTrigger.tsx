'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { isTabbable } from 'tabbable';
import { useEventCallback } from '@base-ui-components/utils/useEventCallback';
import { useIsoLayoutEffect } from '@base-ui-components/utils/useIsoLayoutEffect';
import { visuallyHidden } from '@base-ui-components/utils/visuallyHidden';
import { useTimeout } from '@base-ui-components/utils/useTimeout';
import { useAnimationFrame } from '@base-ui-components/utils/useAnimationFrame';
import { useLatestRef } from '@base-ui-components/utils/useLatestRef';
import {
  safePolygon,
  useClick,
  useDismiss,
  useFloatingRootContext,
  useFloatingTree,
  useHover,
  useInteractions,
} from '../../floating-ui-react';
import {
  contains,
  getNextTabbable,
  getPreviousTabbable,
  getTarget,
  isOutsideEvent,
  stopEvent,
} from '../../floating-ui-react/utils';
import type { BaseUIComponentProps, NativeButtonProps, HTMLProps } from '../../utils/types';
import { useNavigationMenuItemContext } from '../item/NavigationMenuItemContext';
import {
  useNavigationMenuRootContext,
  useNavigationMenuTreeContext,
} from '../root/NavigationMenuRootContext';
import {
  BaseOpenChangeReason,
  translateOpenChangeReason,
} from '../../utils/translateOpenChangeReason';
import { PATIENT_CLICK_THRESHOLD } from '../../utils/constants';
import { FocusGuard } from '../../utils/FocusGuard';
import { pressableTriggerOpenStateMapping } from '../../utils/popupStateMapping';
import { isOutsideMenuEvent } from '../utils/isOutsideMenuEvent';
import { useAnimationsFinished } from '../../utils/useAnimationsFinished';
import { NavigationMenuPopupCssVars } from '../popup/NavigationMenuPopupCssVars';
import { NavigationMenuPositionerCssVars } from '../positioner/NavigationMenuPositionerCssVars';
import { CompositeItem } from '../../composite/item/CompositeItem';
import { useButton } from '../../use-button';
import { getCssDimensions } from '../../utils/getCssDimensions';

const TRIGGER_IDENTIFIER = 'data-base-ui-navigation-menu-trigger';
const DEFAULT_SIZE = { width: 0, height: 0 };
const DEFAULT_ABORT_CONTROLLER = new AbortController();

/**
 * Opens the navigation menu popup when hovered or clicked, revealing the
 * associated content.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 */
export const NavigationMenuTrigger = React.forwardRef(function NavigationMenuTrigger(
  componentProps: NavigationMenuTrigger.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const { className, render, nativeButton = true, disabled, ...elementProps } = componentProps;

  const {
    value,
    setValue,
    mounted,
    open,
    positionerElement,
    setActivationDirection,
    setFloatingRootContext,
    popupElement,
    viewportElement,
    rootRef,
    beforeOutsideRef,
    afterOutsideRef,
    afterInsideRef,
    beforeInsideRef,
    prevTriggerElementRef,
    delay,
    closeDelay,
    orientation,
    setViewportInert,
  } = useNavigationMenuRootContext();
  const itemValue = useNavigationMenuItemContext();
  const nodeId = useNavigationMenuTreeContext();
  const tree = useFloatingTree();

  const stickIfOpenTimeout = useTimeout();
  const focusFrame = useAnimationFrame();
  const sizeFrame1 = useAnimationFrame();
  const sizeFrame2 = useAnimationFrame();

  const [triggerElement, setTriggerElement] = React.useState<HTMLElement | null>(null);
  const [stickIfOpen, setStickIfOpen] = React.useState(true);
  const [pointerType, setPointerType] = React.useState<'mouse' | 'touch' | 'pen' | ''>('');

  const allowFocusRef = React.useRef(false);
  const prevSizeRef = React.useRef(DEFAULT_SIZE);
  const animationAbortControllerRef = React.useRef(DEFAULT_ABORT_CONTROLLER);

  const isActiveItem = open && value === itemValue;
  const isActiveItemRef = useLatestRef(isActiveItem);
  const interactionsEnabled = positionerElement ? true : !value;

  const runOnceAnimationsFinish = useAnimationsFinished(popupElement);

  React.useEffect(() => {
    animationAbortControllerRef.current.abort();
  }, [isActiveItem]);

  const setAutoSizes = useEventCallback(() => {
    if (!popupElement) {
      return;
    }

    popupElement.style.setProperty(NavigationMenuPopupCssVars.popupWidth, 'auto');
    popupElement.style.setProperty(NavigationMenuPopupCssVars.popupHeight, 'auto');
  });

  const handleValueChange = useEventCallback((currentWidth: number, currentHeight: number) => {
    if (!popupElement || !positionerElement) {
      return;
    }

    popupElement.style.removeProperty(NavigationMenuPopupCssVars.popupWidth);
    popupElement.style.removeProperty(NavigationMenuPopupCssVars.popupHeight);
    positionerElement.style.removeProperty(NavigationMenuPositionerCssVars.positionerWidth);
    positionerElement.style.removeProperty(NavigationMenuPositionerCssVars.positionerHeight);

    const { width, height } = getCssDimensions(popupElement);

    if (currentHeight === 0 || currentWidth === 0) {
      currentWidth = width;
      currentHeight = height;
    }

    popupElement.style.setProperty(NavigationMenuPopupCssVars.popupWidth, `${currentWidth}px`);
    popupElement.style.setProperty(NavigationMenuPopupCssVars.popupHeight, `${currentHeight}px`);
    positionerElement.style.setProperty(
      NavigationMenuPositionerCssVars.positionerWidth,
      `${width}px`,
    );
    positionerElement.style.setProperty(
      NavigationMenuPositionerCssVars.positionerHeight,
      `${height}px`,
    );

    sizeFrame1.request(() => {
      popupElement.style.setProperty(NavigationMenuPopupCssVars.popupWidth, `${width}px`);
      popupElement.style.setProperty(NavigationMenuPopupCssVars.popupHeight, `${height}px`);

      sizeFrame2.request(() => {
        animationAbortControllerRef.current = new AbortController();
        runOnceAnimationsFinish(setAutoSizes, animationAbortControllerRef.current.signal);
      });
    });
  });

  React.useEffect(() => {
    if (!open) {
      stickIfOpenTimeout.clear();
      sizeFrame1.cancel();
      sizeFrame2.cancel();
      prevSizeRef.current = DEFAULT_SIZE;
    }
  }, [stickIfOpenTimeout, open, sizeFrame1, sizeFrame2]);

  React.useEffect(() => {
    if (!popupElement || typeof ResizeObserver !== 'function') {
      return undefined;
    }

    const resizeObserver = new ResizeObserver(() => {
      // Using `getCssDimensions` here causes issues due to fractional values.
      prevSizeRef.current = {
        width: popupElement.offsetWidth,
        height: popupElement.offsetHeight,
      };
    });

    resizeObserver.observe(popupElement);

    return () => {
      resizeObserver.disconnect();
    };
  }, [popupElement]);

  React.useEffect(() => {
    if (!popupElement || !isActiveItem || typeof MutationObserver !== 'function') {
      return undefined;
    }

    const mutationObserver = new MutationObserver(() => {
      animationAbortControllerRef.current.abort();
      handleValueChange(prevSizeRef.current.width, prevSizeRef.current.height);
    });

    mutationObserver.observe(popupElement, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      mutationObserver.disconnect();
    };
  }, [popupElement, positionerElement, isActiveItem, handleValueChange, setAutoSizes]);

  React.useEffect(() => {
    if (isActiveItem && open && popupElement && allowFocusRef.current) {
      allowFocusRef.current = false;
      focusFrame.request(() => {
        beforeOutsideRef.current?.focus();
      });
    }

    return () => {
      focusFrame.cancel();
    };
  }, [beforeOutsideRef, focusFrame, handleValueChange, isActiveItem, open, popupElement]);

  useIsoLayoutEffect(() => {
    if (isActiveItemRef.current && open && popupElement) {
      handleValueChange(0, 0);
    }
  }, [isActiveItemRef, open, popupElement, handleValueChange]);

  function handleOpenChange(
    nextOpen: boolean,
    event: Event | undefined,
    reason: BaseOpenChangeReason | undefined,
  ) {
    const isHover = reason === 'trigger-hover';

    if (!interactionsEnabled) {
      return;
    }

    if (pointerType === 'touch' && isHover) {
      return;
    }

    if (!nextOpen && value !== itemValue) {
      return;
    }

    function changeState() {
      if (isHover) {
        // Only allow "patient" clicks to close the popup if it's open.
        // If they clicked within 500ms of the popup opening, keep it open.
        setStickIfOpen(true);
        stickIfOpenTimeout.clear();
        stickIfOpenTimeout.start(PATIENT_CLICK_THRESHOLD, () => {
          setStickIfOpen(false);
        });
      }

      if (nextOpen) {
        setValue(itemValue, event, reason);
      } else {
        setValue(null, event, reason);
        setPointerType('');
      }
    }

    if (isHover) {
      ReactDOM.flushSync(changeState);
    } else {
      changeState();
    }
  }

  const context = useFloatingRootContext({
    open,
    onOpenChange(openValue, eventValue, reasonValue) {
      handleOpenChange(openValue, eventValue, translateOpenChangeReason(reasonValue));
    },
    elements: {
      reference: triggerElement,
      floating: positionerElement || viewportElement,
    },
  });

  const hover = useHover(context, {
    move: false,
    handleClose: safePolygon({ blockPointerEvents: pointerType !== 'touch' }),
    restMs: mounted && positionerElement ? 0 : delay,
    delay: { close: closeDelay },
  });
  const click = useClick(context, {
    enabled: interactionsEnabled,
    stickIfOpen,
    toggle: isActiveItem,
  });
  const dismiss = useDismiss(context, {
    enabled: isActiveItem && interactionsEnabled,
    outsidePress(event) {
      // When pressing a new trigger with touch input, prevent closing the popup.
      const target = getTarget(event) as HTMLElement | null;
      const closestNavigationMenuTrigger = target?.closest(`[${TRIGGER_IDENTIFIER}]`);
      return closestNavigationMenuTrigger === null;
    },
  });

  useIsoLayoutEffect(() => {
    if (isActiveItem) {
      setFloatingRootContext(context);
      prevTriggerElementRef.current = triggerElement;
    }
  }, [isActiveItem, context, setFloatingRootContext, prevTriggerElementRef, triggerElement]);

  const { getReferenceProps } = useInteractions([hover, click, dismiss]);

  function handleActivation(event: React.MouseEvent | React.KeyboardEvent) {
    ReactDOM.flushSync(() => {
      const prevTriggerRect = prevTriggerElementRef.current?.getBoundingClientRect();

      if (mounted && prevTriggerRect && triggerElement) {
        const nextTriggerRect = triggerElement.getBoundingClientRect();
        const isMovingRight = nextTriggerRect.left > prevTriggerRect.left;
        const isMovingDown = nextTriggerRect.top > prevTriggerRect.top;

        if (orientation === 'horizontal' && nextTriggerRect.left !== prevTriggerRect.left) {
          setActivationDirection(isMovingRight ? 'right' : 'left');
        } else if (orientation === 'vertical' && nextTriggerRect.top !== prevTriggerRect.top) {
          setActivationDirection(isMovingDown ? 'down' : 'up');
        }
      }

      // Reset the `openEvent` to `undefined` when the active item changes so that a
      // `click` -> `hover` on new trigger -> `hover` back to old trigger doesn't unexpectedly
      // cause the popup to remain stuck open when leaving the old trigger.
      if (event.type !== 'click') {
        context.dataRef.current.openEvent = undefined;
      }

      if (pointerType === 'touch' && event.type !== 'click') {
        return;
      }

      if (value != null) {
        setValue(
          itemValue,
          event.nativeEvent,
          event.type === 'mouseenter' ? 'trigger-hover' : 'trigger-press',
        );
      }
    });
  }

  const handleOpenEvent = useEventCallback((event: React.MouseEvent | React.KeyboardEvent) => {
    // For nested scenarios without positioner/popup, we can still open the menu
    // but we can't do size calculations
    if (!popupElement || !positionerElement) {
      handleActivation(event);
      return;
    }

    const { width, height } = getCssDimensions(popupElement);

    handleActivation(event);
    handleValueChange(width, height);
  });

  const state: NavigationMenuTrigger.State = React.useMemo(
    () => ({
      open: isActiveItem,
    }),
    [isActiveItem],
  );

  function handleSetPointerType(event: React.PointerEvent) {
    setPointerType(event.pointerType);
  }

  const defaultProps: HTMLProps = {
    tabIndex: 0,
    onMouseEnter: handleOpenEvent,
    onClick: handleOpenEvent,
    onPointerEnter: handleSetPointerType,
    onPointerDown: handleSetPointerType,
    'aria-expanded': isActiveItem,
    'aria-controls': isActiveItem ? popupElement?.id : undefined,
    [TRIGGER_IDENTIFIER as string]: '',
    onFocus() {
      if (!isActiveItem) {
        return;
      }
      setViewportInert(false);
    },
    onMouseMove() {
      allowFocusRef.current = false;
    },
    onKeyDown(event) {
      allowFocusRef.current = true;
      const openHorizontal = orientation === 'horizontal' && event.key === 'ArrowDown';
      const openVertical = orientation === 'vertical' && event.key === 'ArrowRight';

      if (openHorizontal || openVertical) {
        setValue(itemValue, event.nativeEvent, 'list-navigation');
        handleOpenEvent(event);
        stopEvent(event);
      }
    },
    onBlur(event) {
      if (
        positionerElement &&
        popupElement &&
        isOutsideMenuEvent(
          {
            currentTarget: event.currentTarget,
            relatedTarget: event.relatedTarget as HTMLElement | null,
          },
          { popupElement, rootRef, tree, nodeId },
        )
      ) {
        setValue(null, event.nativeEvent, 'focus-out');
      }
    },
  };

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    focusableWhenDisabled: true,
    native: nativeButton,
  });

  const referenceElement = positionerElement || viewportElement;

  return (
    <React.Fragment>
      <CompositeItem
        tag="button"
        render={render}
        className={className}
        state={state}
        customStyleHookMapping={pressableTriggerOpenStateMapping}
        refs={[forwardedRef, setTriggerElement, buttonRef]}
        props={[getReferenceProps, defaultProps, elementProps, getButtonProps]}
      />
      {isActiveItem && (
        <React.Fragment>
          <FocusGuard
            ref={beforeOutsideRef}
            onFocus={(event) => {
              if (referenceElement && isOutsideEvent(event, referenceElement)) {
                beforeInsideRef.current?.focus();
              } else {
                const prevTabbable = getPreviousTabbable(triggerElement);
                prevTabbable?.focus();
              }
            }}
          />
          <span aria-owns={viewportElement?.id} style={visuallyHidden} />
          <FocusGuard
            ref={afterOutsideRef}
            onFocus={(event) => {
              if (referenceElement && isOutsideEvent(event, referenceElement)) {
                const elementToFocus =
                  afterInsideRef.current && isTabbable(afterInsideRef.current)
                    ? afterInsideRef.current
                    : triggerElement;
                elementToFocus?.focus();
              } else {
                const nextTabbable = getNextTabbable(triggerElement);
                nextTabbable?.focus();

                if (!contains(rootRef.current, nextTabbable)) {
                  setValue(null, event.nativeEvent, 'focus-out');
                }
              }
            }}
          />
        </React.Fragment>
      )}
    </React.Fragment>
  );
});

export namespace NavigationMenuTrigger {
  export interface State {
    /**
     * If `true`, the popup is open and the item is active.
     */
    open: boolean;
  }

  export interface Props extends NativeButtonProps, BaseUIComponentProps<'button', State> {}
}
