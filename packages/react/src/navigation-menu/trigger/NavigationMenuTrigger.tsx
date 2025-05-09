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
} from '@floating-ui/react';
import {
  contains,
  getNextTabbable,
  getPreviousTabbable,
  getTarget,
  isOutsideEvent,
  stopEvent,
} from '@floating-ui/react/utils';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useNavigationMenuItemContext } from '../item/NavigationMenuItemContext';
import {
  useNavigationMenuRootContext,
  useNavigationMenuTreeContext,
} from '../root/NavigationMenuRootContext';
import { useEventCallback } from '../../utils/useEventCallback';
import { translateOpenChangeReason } from '../../utils/translateOpenChangeReason';
import { PATIENT_CLICK_THRESHOLD } from '../../utils/constants';
import { FocusGuard } from '../../toast/viewport/FocusGuard';
import { useModernLayoutEffect } from '../../utils/useModernLayoutEffect';
import { visuallyHidden } from '../../utils/visuallyHidden';
import { CompositeItem } from '../../composite/item/CompositeItem';
import { pressableTriggerOpenStateMapping } from '../../utils/popupStateMapping';
import { isOutsideMenuEvent } from '../utils/isOutsideMenuEvent';

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
    setOpen,
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

  const timeoutRef = React.useRef(-1);
  const stickIfOpenTimeoutRef = React.useRef(-1);

  const [triggerElement, setTriggerElement] = React.useState<HTMLElement | null>(null);
  const [stickIfOpen, setStickIfOpen] = React.useState(true);
  const [pointerType, setPointerType] = React.useState<'mouse' | 'touch' | 'pen' | ''>('');

  const isActiveItem = open && value === itemValue;

  const clearStickIfOpenTimeout = useEventCallback(() => {
    clearTimeout(stickIfOpenTimeoutRef.current);
  });

  React.useEffect(() => {
    clearTimeout(timeoutRef.current);
  }, [value]);

  React.useEffect(() => {
    if (!open) {
      clearStickIfOpenTimeout();
      setPointerType('');
    }
  }, [clearStickIfOpenTimeout, open]);

  React.useEffect(() => {
    return clearStickIfOpenTimeout;
  }, [clearStickIfOpenTimeout]);

  const context = useFloatingRootContext({
    open,
    onOpenChange(openValue, eventValue, reasonValue) {
      const isHover = reasonValue === 'hover' || reasonValue === 'safe-polygon';

      if (pointerType === 'touch' && isHover) {
        return;
      }

      if (!openValue && value !== itemValue) {
        return;
      }

      const translatedReason = translateOpenChangeReason(reasonValue);

      function changeState() {
        if (isHover) {
          // Only allow "patient" clicks to close the popup if it's open.
          // If they clicked within 500ms of the popup opening, keep it open.
          setStickIfOpen(true);
          clearStickIfOpenTimeout();
          stickIfOpenTimeoutRef.current = window.setTimeout(() => {
            setStickIfOpen(false);
          }, PATIENT_CLICK_THRESHOLD);
        }

        setOpen(openValue, eventValue, translatedReason);

        if (openValue) {
          setValue(itemValue);
        } else {
          setActivationDirection(null);
          setValue(undefined);
          setFloatingRootContext(undefined);
        }
      }

      if (isHover) {
        ReactDOM.flushSync(changeState);
      } else {
        changeState();
      }
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
    const prevTriggerRect = prevTriggerElementRef.current?.getBoundingClientRect();

    ReactDOM.flushSync(() => {
      if (mounted && prevTriggerRect && triggerElement) {
        const nextTriggerRect = triggerElement.getBoundingClientRect();
        const isMovingRight = nextTriggerRect.left > prevTriggerRect.left;
        if (nextTriggerRect.left !== prevTriggerRect.left) {
          setActivationDirection(isMovingRight ? 'right' : 'left');
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

      setValue(itemValue);
    });
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

  const renderElement = useRenderElement('button', componentProps, {
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
        onKeyDown(event) {
          const key = orientation === 'horizontal' ? 'ArrowDown' : 'ArrowRight';
          if (open && event.key === key) {
            stopEvent(event);
            const nextTabbable = getNextTabbable(popupElement);
            nextTabbable?.focus();
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
            setOpen(false, event.nativeEvent, undefined);
          }
        },
      },
      elementProps,
    ],
    customStyleHookMapping: pressableTriggerOpenStateMapping,
  });

  return (
    <React.Fragment>
      <CompositeItem render={renderElement()} />
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
                  setOpen(false, event.nativeEvent, undefined);
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
     * If `true`, the popup is open.
     */
    open: boolean;
  }

  export interface Props extends BaseUIComponentProps<'button', State> {}
}
