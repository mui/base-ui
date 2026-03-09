'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { isHTMLElement } from '@floating-ui/utils/dom';
import { isTabbable } from 'tabbable';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useTimeout } from '@base-ui/utils/useTimeout';
import { useAnimationFrame } from '@base-ui/utils/useAnimationFrame';
import {
  safePolygon,
  useClick,
  useFloatingRootContext,
  useFloatingTree,
  useHoverReferenceInteraction,
  useInteractions,
} from '../../floating-ui-react';
import {
  applySafePolygonPointerEventsMutation,
  clearSafePolygonPointerEventsMutation,
  useHoverInteractionSharedState,
} from '../../floating-ui-react/hooks/useHoverInteractionSharedState';
import {
  contains,
  getTabbableAfterElement,
  getNextTabbable,
  getPreviousTabbable,
  isOutsideEvent,
  stopEvent,
} from '../../floating-ui-react/utils';
import type { HandleCloseContextBase } from '../../floating-ui-react/hooks/useHoverShared';
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
import { CompositeItem } from '../../composite/item/CompositeItem';
import { useButton } from '../../use-button';
import { useAnimationsFinished } from '../../utils/useAnimationsFinished';
import { NavigationMenuRoot } from '../root/NavigationMenuRoot';
import { NAVIGATION_MENU_TRIGGER_IDENTIFIER } from '../utils/constants';
import { useNavigationMenuDismissContext } from '../list/NavigationMenuDismissContext';
import {
  clearFixedSizes,
  EMPTY_SIZE,
  getCommittedSize,
  getFixedSize,
  setSharedFixedSize,
} from '../utils/setFixedSize';

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
    currentContentRef,
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
  const resizeFrame = useAnimationFrame();

  const [triggerElement, setTriggerElement] = React.useState<HTMLElement | null>(null);
  const triggerElementRef = React.useRef<HTMLElement | null>(null);
  const [stickIfOpen, setStickIfOpen] = React.useState(true);
  const [pointerType, setPointerType] = React.useState<'mouse' | 'touch' | 'pen' | ''>('');

  const allowFocusRef = React.useRef(false);
  const prevSizeRef = React.useRef(EMPTY_SIZE);
  const animationAbortControllerRef = React.useRef<AbortController | null>(null);

  const isActiveItem = open && value === itemValue;
  const interactionsEnabled = positionerElement ? true : !value;
  const hoverFloatingElement = positionerElement || viewportElement;
  const hoverInteractionsEnabled = hoverFloatingElement ? true : !value;

  const runOnceAnimationsFinish = useAnimationsFinished(popupElement, false, false);

  const handleTriggerElement = React.useCallback((element: HTMLElement | null) => {
    triggerElementRef.current = element;
    setTriggerElement(element);
  }, []);

  React.useEffect(() => {
    if (!open) {
      stickIfOpenTimeout.clear();
      resizeFrame.cancel();
      animationAbortControllerRef.current?.abort();
      animationAbortControllerRef.current = null;
      setPointerType('');
    }
  }, [stickIfOpenTimeout, open, resizeFrame]);

  React.useEffect(() => {
    if (!mounted) {
      prevSizeRef.current = EMPTY_SIZE;
    }
  }, [mounted]);

  React.useEffect(() => {
    if (!popupElement || typeof ResizeObserver !== 'function') {
      return undefined;
    }

    const updateSize = () => {
      const nextSize = {
        width: popupElement.offsetWidth,
        height: popupElement.offsetHeight,
      };

      if (nextSize.width !== 0 && nextSize.height !== 0) {
        prevSizeRef.current = nextSize;
      }
    };

    updateSize();

    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(popupElement);

    return () => {
      resizeObserver.disconnect();
    };
  }, [popupElement]);

  React.useEffect(() => {
    const observedElement = currentContentRef.current;

    if (
      !observedElement ||
      !popupElement ||
      !positionerElement ||
      !isActiveItem ||
      typeof MutationObserver !== 'function'
    ) {
      return undefined;
    }

    const runResizeTransition = () => {
      const previousSize = getCommittedSize(popupElement, 'popup', prevSizeRef.current);

      if (previousSize.width === 0 || previousSize.height === 0) {
        return;
      }

      resizeFrame.cancel();
      clearFixedSizes(popupElement, positionerElement);

      const nextSize = getFixedSize(popupElement, 'popup', previousSize);

      if (nextSize.width === 0 || nextSize.height === 0) {
        return;
      }

      prevSizeRef.current = nextSize;
      setSharedFixedSize(popupElement, positionerElement, previousSize);

      resizeFrame.request(() => {
        setSharedFixedSize(popupElement, positionerElement, nextSize);

        animationAbortControllerRef.current?.abort();
        const abortController = new AbortController();
        animationAbortControllerRef.current = abortController;

        runOnceAnimationsFinish(() => {
          if (!popupElement) {
            return;
          }

          popupElement.style.setProperty('--popup-width', 'auto');
          popupElement.style.setProperty('--popup-height', 'auto');
        }, abortController.signal);
      });
    };

    const mutationObserver = new MutationObserver(runResizeTransition);

    mutationObserver.observe(observedElement, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      mutationObserver.disconnect();
      resizeFrame.cancel();
      animationAbortControllerRef.current?.abort();
      animationAbortControllerRef.current = null;
    };
  }, [
    currentContentRef,
    popupElement,
    positionerElement,
    isActiveItem,
    resizeFrame,
    runOnceAnimationsFinish,
    value,
  ]);

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
  }, [beforeOutsideRef, focusFrame, isActiveItem, open, popupElement]);

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
      floating: hoverFloatingElement,
    },
  });

  const hoverInteractionState = useHoverInteractionSharedState(context);

  React.useEffect(() => {
    if (!open) {
      context.context.dataRef.current.openEvent = undefined;
      hoverInteractionState.pointerType = undefined;
      hoverInteractionState.interactedInside = false;
      hoverInteractionState.restTimeoutPending = false;
      hoverInteractionState.openChangeTimeout.clear();
      hoverInteractionState.restTimeout.clear();
      clearSafePolygonPointerEventsMutation(hoverInteractionState);
    }
  }, [context, hoverInteractionState, open]);

  const getInlineHandleCloseContext = useStableCallback(() => {
    if (!nested || positionerElement || !triggerElementRef.current || !hoverFloatingElement) {
      return null;
    }

    return getHandleCloseContext(triggerElementRef.current, hoverFloatingElement, nodeId);
  });

  function getScope() {
    if (!nested || positionerElement) {
      return null;
    }

    return triggerElementRef.current?.closest('ul') ?? null;
  }

  const hoverProps = useHoverReferenceInteraction(context, {
    enabled: hoverInteractionsEnabled,
    move: false,
    handleClose: safePolygon({
      blockPointerEvents: pointerType !== 'touch',
      getScope,
    }),
    restMs: mounted && positionerElement ? 0 : delay,
    delay: { close: closeDelay },
    triggerElementRef,
    getHandleCloseContext: getInlineHandleCloseContext,
  });

  const hover = React.useMemo(
    () => (hoverProps ? { reference: hoverProps } : undefined),
    [hoverProps],
  );

  const click = useClick(context, {
    enabled: interactionsEnabled,
    stickIfOpen,
    toggle: isActiveItem,
  });
  const { getReferenceProps } = useInteractions([hover, click]);

  useIsoLayoutEffect(() => {
    if (isActiveItem) {
      setFloatingRootContext(context);
      prevTriggerElementRef.current = triggerElement;
    }
  }, [isActiveItem, context, setFloatingRootContext, prevTriggerElementRef, triggerElement]);

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
      if (event.type !== 'click' && value != null) {
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

      if (
        event.type === 'mouseenter' &&
        nested &&
        !positionerElement &&
        pointerType !== 'touch' &&
        hoverFloatingElement &&
        isHTMLElement(event.currentTarget)
      ) {
        const scopeElement = getScope();

        if (!scopeElement) {
          return;
        }

        applySafePolygonPointerEventsMutation(hoverInteractionState, {
          scopeElement,
          referenceElement: event.currentTarget,
          floatingElement: hoverFloatingElement,
        });
      }
    });
  }

  const state: NavigationMenuTriggerState = {
    open: isActiveItem,
  };

  function handleSetPointerType(event: React.PointerEvent) {
    setPointerType(event.pointerType);
  }

  const defaultProps: HTMLProps = {
    tabIndex: 0,
    onMouseEnter: handleActivation,
    onClick: handleActivation,
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
        handleActivation(event);
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

  const referenceElement = hoverFloatingElement;

  return (
    <React.Fragment>
      <CompositeItem
        tag="button"
        render={render}
        className={className}
        state={state}
        stateAttributesMapping={pressableTriggerOpenStateMapping}
        refs={[forwardedRef, handleTriggerElement, buttonRef]}
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
                let nextTabbable = getNextTabbable(triggerElement);

                if (
                  nested &&
                  !positionerElement &&
                  referenceElement &&
                  nextTabbable &&
                  contains(referenceElement, nextTabbable)
                ) {
                  nextTabbable = getTabbableAfterElement(afterInsideRef.current);
                }

                nextTabbable?.focus();

                if ((!nested || positionerElement) && !contains(rootRef.current, nextTabbable)) {
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
  extends NativeButtonProps, BaseUIComponentProps<'button', NavigationMenuTriggerState> {}

export namespace NavigationMenuTrigger {
  export type State = NavigationMenuTriggerState;
  export type Props = NavigationMenuTriggerProps;
}

function getPlacementFromElements(
  domReferenceElement: Element,
  floatingElement: HTMLElement,
): HandleCloseContextBase['placement'] {
  const referenceRect = domReferenceElement.getBoundingClientRect();
  const floatingRect = floatingElement.getBoundingClientRect();
  const referenceCenterX = referenceRect.left + referenceRect.width / 2;
  const referenceCenterY = referenceRect.top + referenceRect.height / 2;
  const floatingCenterX = floatingRect.left + floatingRect.width / 2;
  const floatingCenterY = floatingRect.top + floatingRect.height / 2;
  const deltaX = floatingCenterX - referenceCenterX;
  const deltaY = floatingCenterY - referenceCenterY;

  if (Math.abs(deltaX) >= Math.abs(deltaY)) {
    return deltaX >= 0 ? 'right' : 'left';
  }

  return deltaY >= 0 ? 'bottom' : 'top';
}

function getHandleCloseContext(
  domReferenceElement: Element,
  floatingElement: HTMLElement,
  nodeId: string | undefined,
): HandleCloseContextBase {
  return {
    placement: getPlacementFromElements(domReferenceElement, floatingElement),
    elements: {
      domReference: domReferenceElement,
      floating: floatingElement,
    },
    nodeId,
  };
}
