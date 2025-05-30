'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
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
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useNavigationMenuItemContext } from '../item/NavigationMenuItemContext';
import {
  useNavigationMenuRootContext,
  useNavigationMenuTreeContext,
} from '../root/NavigationMenuRootContext';
import { useEventCallback } from '../../utils/useEventCallback';
import {
  BaseOpenChangeReason,
  translateOpenChangeReason,
} from '../../utils/translateOpenChangeReason';
import { PATIENT_CLICK_THRESHOLD } from '../../utils/constants';
import { FocusGuard } from '../../toast/viewport/FocusGuard';
import { useModernLayoutEffect } from '../../utils/useModernLayoutEffect';
import { visuallyHidden } from '../../utils/visuallyHidden';
import { CompositeItem } from '../../composite/item/CompositeItem';
import { pressableTriggerOpenStateMapping } from '../../utils/popupStateMapping';
import { isOutsideMenuEvent } from '../utils/isOutsideMenuEvent';
import { useTimeout } from '../../utils/useTimeout';
import { useAnimationFrame } from '../../utils/useAnimationFrame';
import { useLatestRef } from '../../utils/useLatestRef';

const TRIGGER_IDENTIFIER = 'data-navigation-menu-trigger';

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
  const { className, render, ...elementProps } = componentProps;

  const {
    value,
    setValue,
    mounted,
    open,
    positionerElement,
    setActivationDirection,
    setFloatingRootContext,
    popupElement,
    rootRef,
    beforeOutsideRef,
    afterOutsideRef,
    afterInsideRef,
    beforeInsideRef,
    prevTriggerElementRef,
    delay,
    closeDelay,
    orientation,
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

  const isActiveItem = open && value === itemValue;
  const isActiveItemRef = useLatestRef(isActiveItem);

  const allowFocusRef = React.useRef(false);

  const handleValueChange = useEventCallback((currentWidth: number, currentHeight: number) => {
    if (!popupElement || !positionerElement) {
      return;
    }

    popupElement.style.removeProperty('--popup-width');
    popupElement.style.removeProperty('--popup-height');
    positionerElement.style.removeProperty('--positioner-width');
    positionerElement.style.removeProperty('--positioner-height');

    const nextWidth = popupElement.offsetWidth;
    const nextHeight = popupElement.offsetHeight;

    if (currentHeight === 0 || currentWidth === 0) {
      currentWidth = nextWidth;
      currentHeight = nextHeight;
    }

    popupElement.style.setProperty('--popup-width', `${currentWidth}px`);
    popupElement.style.setProperty('--popup-height', `${currentHeight}px`);
    positionerElement.style.setProperty('--positioner-width', `${nextWidth}px`);
    positionerElement.style.setProperty('--positioner-height', `${nextHeight}px`);

    sizeFrame1.request(() => {
      sizeFrame2.request(() => {
        popupElement.style.setProperty('--popup-width', `${nextWidth}px`);
        popupElement.style.setProperty('--popup-height', `${nextHeight}px`);
      });
    });
  });

  React.useEffect(() => {
    if (!open) {
      setPointerType('');
      stickIfOpenTimeout.clear();
      sizeFrame1.cancel();
      sizeFrame2.cancel();
    }
  }, [stickIfOpenTimeout, open, sizeFrame1, sizeFrame2]);

  useModernLayoutEffect(() => {
    if (isActiveItemRef.current && open && popupElement) {
      handleValueChange(0, 0);
    }
  }, [isActiveItemRef, open, popupElement, handleValueChange]);

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

  function handleOpenChange(
    nextOpen: boolean,
    event: Event | undefined,
    reason: BaseOpenChangeReason | undefined,
  ) {
    const isHover = reason === 'trigger-hover';

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
      floating: positionerElement,
    },
  });

  const hover = useHover(context, {
    move: false,
    handleClose: safePolygon({ blockPointerEvents: pointerType !== 'touch' }),
    restMs: mounted ? 0 : delay,
    delay: { close: closeDelay },
  });
  const click = useClick(context, {
    stickIfOpen,
    toggle: isActiveItem,
  });
  const dismiss = useDismiss(context, {
    enabled: isActiveItem,
    outsidePress(event) {
      // When pressing a new trigger with touch input, prevent closing the popup.
      const target = getTarget(event) as HTMLElement | null;
      const closestNavigationMenuTrigger = target?.closest(`[${TRIGGER_IDENTIFIER}]`);
      return closestNavigationMenuTrigger === null;
    },
  });

  useModernLayoutEffect(() => {
    if (isActiveItem) {
      setFloatingRootContext(context);
      prevTriggerElementRef.current = triggerElement;
    }
  }, [isActiveItem, context, setFloatingRootContext, prevTriggerElementRef, triggerElement]);

  const { getReferenceProps } = useInteractions([hover, click, dismiss]);

  const handleOpenEvent = useEventCallback((event: React.MouseEvent) => {
    if (!popupElement || !positionerElement) {
      return;
    }

    const currentWidth = popupElement.offsetWidth;
    const currentHeight = popupElement.offsetHeight;

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
      // `click` -> `hover` move to new trigger -> `hover` move back doesn't unepxpectedly
      // cause the popup to remain stuck open.
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

    handleValueChange(currentWidth, currentHeight);
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

  const element = useRenderElement('button', componentProps, {
    state,
    ref: [forwardedRef, setTriggerElement],
    props: [
      getReferenceProps,
      {
        tabIndex: 0,
        onMouseEnter: handleOpenEvent,
        onClick: handleOpenEvent,
        onPointerEnter: handleSetPointerType,
        onPointerDown: handleSetPointerType,
        'aria-expanded': isActiveItem,
        'aria-controls': isActiveItem ? popupElement?.id : undefined,
        [TRIGGER_IDENTIFIER as string]: '',
        onMouseMove() {
          allowFocusRef.current = false;
        },
        onKeyDown(event) {
          allowFocusRef.current = true;
          const openHorizontal = orientation === 'horizontal' && event.key === 'ArrowDown';
          const openVertical = orientation === 'vertical' && event.key === 'ArrowRight';

          if (openHorizontal || openVertical) {
            setValue(itemValue, event.nativeEvent, 'list-navigation');
            stopEvent(event);
          }
        },
        onBlur(event) {
          if (
            event.relatedTarget &&
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
      },
      elementProps,
    ],
    customStyleHookMapping: pressableTriggerOpenStateMapping,
  });

  return (
    <React.Fragment>
      <CompositeItem render={element} />
      {isActiveItem && (
        <React.Fragment>
          <FocusGuard
            ref={beforeOutsideRef}
            onFocus={(event) => {
              if (positionerElement && isOutsideEvent(event, positionerElement)) {
                beforeInsideRef.current?.focus();
              } else {
                const prevTabbable = getPreviousTabbable(triggerElement);
                prevTabbable?.focus();
              }
            }}
          />
          <span aria-owns={popupElement?.id} style={visuallyHidden} />
          <FocusGuard
            ref={afterOutsideRef}
            onFocus={(event) => {
              if (positionerElement && isOutsideEvent(event, positionerElement)) {
                afterInsideRef.current?.focus();
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

  export interface Props extends BaseUIComponentProps<'button', State> {}
}
