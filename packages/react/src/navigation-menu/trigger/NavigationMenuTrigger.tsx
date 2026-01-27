'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { isTabbable } from 'tabbable';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useTimeout } from '@base-ui/utils/useTimeout';
import { useAnimationFrame } from '@base-ui/utils/useAnimationFrame';
import { useValueAsRef } from '@base-ui/utils/useValueAsRef';
import {
  safePolygon,
  useClick,
  useFloatingRootContext,
  useFloatingTree,
  useHover,
  useInteractions,
} from '../../floating-ui-react';
import {
  contains,
  getNextTabbable,
  getPreviousTabbable,
  isOutsideEvent,
  stopEvent,
} from '../../floating-ui-react/utils';
import type { BaseUIComponentProps, NativeButtonProps, HTMLProps } from '../../utils/types';
import { useNavigationMenuItemContext } from '../item/NavigationMenuItemContext';
import {
  useNavigationMenuRootContext,
  useNavigationMenuTreeContext,
} from '../root/NavigationMenuRootContext';
import { createChangeEventDetails } from '../../utils/createBaseUIEventDetails';
import { REASONS } from '../../utils/reasons';
import { EMPTY_ARRAY, ownerVisuallyHidden, PATIENT_CLICK_THRESHOLD } from '../../utils/constants';
import { FocusGuard } from '../../utils/FocusGuard';
import { pressableTriggerOpenStateMapping } from '../../utils/popupStateMapping';
import { isOutsideMenuEvent } from '../utils/isOutsideMenuEvent';
import { useAnimationsFinished } from '../../utils/useAnimationsFinished';
import { NavigationMenuPopupCssVars } from '../popup/NavigationMenuPopupCssVars';
import { NavigationMenuPositionerCssVars } from '../positioner/NavigationMenuPositionerCssVars';
import { CompositeItem } from '../../composite/item/CompositeItem';
import { useButton } from '../../use-button';
import { getCssDimensions } from '../../utils/getCssDimensions';
import { NavigationMenuRoot } from '../root/NavigationMenuRoot';
import { NAVIGATION_MENU_TRIGGER_IDENTIFIER } from '../utils/constants';
import { useNavigationMenuDismissContext } from '../list/NavigationMenuDismissContext';

const DEFAULT_SIZE = { width: 0, height: 0 };

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
    nested,
  } = useNavigationMenuRootContext();
  const { value: itemValue } = useNavigationMenuItemContext();
  const nodeId = useNavigationMenuTreeContext();
  const tree = useFloatingTree();
  const dismissProps = useNavigationMenuDismissContext();

  const stickIfOpenTimeout = useTimeout();
  const focusFrame = useAnimationFrame();
  const sizeFrame1 = useAnimationFrame();
  const sizeFrame2 = useAnimationFrame();

  const [triggerElement, setTriggerElement] = React.useState<HTMLElement | null>(null);
  const [stickIfOpen, setStickIfOpen] = React.useState(true);
  const [pointerType, setPointerType] = React.useState<'mouse' | 'touch' | 'pen' | ''>('');

  const allowFocusRef = React.useRef(false);
  const prevSizeRef = React.useRef(DEFAULT_SIZE);
  const animationAbortControllerRef = React.useRef<AbortController | null>(null);

  const isActiveItem = open && value === itemValue;
  const isActiveItemRef = useValueAsRef(isActiveItem);
  const interactionsEnabled = positionerElement ? true : !value;

  const runOnceAnimationsFinish = useAnimationsFinished(popupElement);

  React.useEffect(() => {
    animationAbortControllerRef.current?.abort();
  }, [isActiveItem]);

  function setAutoSizes() {
    if (!popupElement) {
      return;
    }

    popupElement.style.setProperty(NavigationMenuPopupCssVars.popupWidth, 'auto');
    popupElement.style.setProperty(NavigationMenuPopupCssVars.popupHeight, 'auto');
  }

  const handleValueChange = useStableCallback((currentWidth: number, currentHeight: number) => {
    if (!popupElement || !positionerElement) {
      return;
    }

    popupElement.style.removeProperty(NavigationMenuPopupCssVars.popupWidth);
    popupElement.style.removeProperty(NavigationMenuPopupCssVars.popupHeight);
    positionerElement.style.removeProperty(NavigationMenuPositionerCssVars.positionerWidth);
    positionerElement.style.removeProperty(NavigationMenuPositionerCssVars.positionerHeight);

    const { width, height } = getCssDimensions(popupElement);
    const measuredWidth = width || prevSizeRef.current.width;
    const measuredHeight = height || prevSizeRef.current.height;

    if (currentHeight === 0 || currentWidth === 0) {
      currentWidth = measuredWidth;
      currentHeight = measuredHeight;
    }

    popupElement.style.setProperty(NavigationMenuPopupCssVars.popupWidth, `${currentWidth}px`);
    popupElement.style.setProperty(NavigationMenuPopupCssVars.popupHeight, `${currentHeight}px`);
    positionerElement.style.setProperty(
      NavigationMenuPositionerCssVars.positionerWidth,
      `${measuredWidth}px`,
    );
    positionerElement.style.setProperty(
      NavigationMenuPositionerCssVars.positionerHeight,
      `${measuredHeight}px`,
    );

    sizeFrame1.request(() => {
      popupElement.style.setProperty(NavigationMenuPopupCssVars.popupWidth, `${measuredWidth}px`);
      popupElement.style.setProperty(NavigationMenuPopupCssVars.popupHeight, `${measuredHeight}px`);

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
    }
  }, [stickIfOpenTimeout, open, sizeFrame1, sizeFrame2]);

  React.useEffect(() => {
    if (!mounted) {
      prevSizeRef.current = DEFAULT_SIZE;
    }
  }, [mounted]);

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
      animationAbortControllerRef.current?.abort();
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
  }, [popupElement, positionerElement, isActiveItem, handleValueChange]);

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
    eventDetails: NavigationMenuRoot.ChangeEventDetails,
  ) {
    const isHover = eventDetails.reason === REASONS.triggerHover;

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
        setValue(itemValue, eventDetails);
      } else {
        setValue(null, eventDetails);
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
    onOpenChange: handleOpenChange,
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
  useIsoLayoutEffect(() => {
    if (isActiveItem) {
      setFloatingRootContext(context);
      prevTriggerElementRef.current = triggerElement;
    }
  }, [isActiveItem, context, setFloatingRootContext, prevTriggerElementRef, triggerElement]);

  const { getReferenceProps } = useInteractions([hover, click]);

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
        context.context.dataRef.current.openEvent = undefined;
      }

      if (pointerType === 'touch' && event.type !== 'click') {
        return;
      }

      if (value != null) {
        setValue(
          itemValue,
          createChangeEventDetails(
            event.type === 'mouseenter' ? REASONS.triggerHover : REASONS.triggerPress,
            event.nativeEvent,
          ),
        );
      }
    });
  }

  const handleOpenEvent = useStableCallback((event: React.MouseEvent | React.KeyboardEvent) => {
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

  const state: NavigationMenuTrigger.State = {
    open: isActiveItem,
  };

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
    [NAVIGATION_MENU_TRIGGER_IDENTIFIER as string]: '',
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

      // For nested (submenu) triggers, don't intercept arrow keys that are used for
      // navigation in the parent content. The arrow keys should be handled by the
      // parent's CompositeRoot for navigating between items.
      if (nested) {
        return;
      }

      const openHorizontal = orientation === 'horizontal' && event.key === 'ArrowDown';
      const openVertical = orientation === 'vertical' && event.key === 'ArrowRight';

      if (openHorizontal || openVertical) {
        setValue(itemValue, createChangeEventDetails(REASONS.listNavigation, event.nativeEvent));
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
        setValue(null, createChangeEventDetails(REASONS.focusOut, event.nativeEvent));
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
        stateAttributesMapping={pressableTriggerOpenStateMapping}
        refs={[forwardedRef, setTriggerElement, buttonRef]}
        props={[
          getReferenceProps,
          dismissProps?.reference || EMPTY_ARRAY,
          defaultProps,
          elementProps,
          getButtonProps,
        ]}
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
          <span aria-owns={viewportElement?.id} style={ownerVisuallyHidden} />
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
                  setValue(null, createChangeEventDetails(REASONS.focusOut, event.nativeEvent));
                }
              }
            }}
          />
        </React.Fragment>
      )}
    </React.Fragment>
  );
});

export interface NavigationMenuTriggerState {
  /**
   * If `true`, the popup is open and the item is active.
   */
  open: boolean;
}

export interface NavigationMenuTriggerProps
  extends NativeButtonProps, BaseUIComponentProps<'button', NavigationMenuTrigger.State> {}

export namespace NavigationMenuTrigger {
  export type State = NavigationMenuTriggerState;
  export type Props = NavigationMenuTriggerProps;
}
