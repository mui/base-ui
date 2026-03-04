'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import {
  safePolygon,
  useFloatingRootContext,
  useHoverFloatingInteraction,
  useHoverReferenceInteraction,
} from '../../floating-ui-react';
import type { BaseUIComponentProps, HTMLProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useNavigationMenuItemContext } from '../item/NavigationMenuItemContext';
import { useNavigationMenuRootContext } from '../root/NavigationMenuRootContext';
import { REASONS } from '../../utils/reasons';
import { EMPTY_OBJECT } from '../../utils/constants';
import { useNavigationMenuDismissContext } from '../list/NavigationMenuDismissContext';
import { triggerOpenStateMapping } from '../../utils/popupStateMapping';
import type { NavigationMenuRoot } from '../root/NavigationMenuRoot';
import { createChangeEventDetails } from '../../utils/createBaseUIEventDetails';
import { NavigationMenuTriggerGroupContext } from './NavigationMenuTriggerGroupContext';

const NAVIGATION_MENU_TRIGGER_GROUP_IDENTIFIER = 'data-base-ui-navigation-menu-trigger-group';

/**
 * A wrapper for `TriggerLink` and `Trigger` that opens the navigation menu popup on hover.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 */
export const NavigationMenuTriggerGroup = React.forwardRef(function NavigationMenuTriggerGroup(
  componentProps: NavigationMenuTriggerGroup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, ...elementProps } = componentProps;

  const {
    open,
    value,
    setValue,
    mounted,
    positionerElement,
    viewportElement,
    setActivationDirection,
    delay,
    closeDelay,
    setFloatingRootContext,
    orientation,
    prevTriggerElementRef,
    rootRef,
  } = useNavigationMenuRootContext();
  const { value: itemValue } = useNavigationMenuItemContext();
  const dismissProps = useNavigationMenuDismissContext();

  const [groupElement, setGroupElement] = React.useState<HTMLElement | null>(null);
  const [pointerType, setPointerType] = React.useState<'mouse' | 'touch' | 'pen' | ''>('');

  const isActiveItem = open && value === itemValue;
  const interactionsEnabled = positionerElement ? true : !value;

  function setTransitionDirection() {
    const previousActiveGroup = rootRef.current?.querySelector<HTMLElement>(
      `[${NAVIGATION_MENU_TRIGGER_GROUP_IDENTIFIER}][data-popup-open]`,
    );
    const previousReference =
      (previousActiveGroup && previousActiveGroup !== groupElement ? previousActiveGroup : null) ||
      (prevTriggerElementRef.current instanceof HTMLElement ? prevTriggerElementRef.current : null);

    if (!mounted || !previousReference || !groupElement) {
      return;
    }

    const prevTriggerRect = previousReference.getBoundingClientRect();
    const nextTriggerRect = groupElement.getBoundingClientRect();
    const isMovingRight = nextTriggerRect.left > prevTriggerRect.left;
    const isMovingDown = nextTriggerRect.top > prevTriggerRect.top;

    if (orientation === 'horizontal') {
      if (nextTriggerRect.left !== prevTriggerRect.left) {
        setActivationDirection(isMovingRight ? 'right' : 'left');
        return;
      }

      const order = previousReference.compareDocumentPosition(groupElement);
      if (order === Node.DOCUMENT_POSITION_FOLLOWING) {
        setActivationDirection('right');
      } else if (order === Node.DOCUMENT_POSITION_PRECEDING) {
        setActivationDirection('left');
      }
      return;
    }

    if (orientation === 'vertical') {
      if (nextTriggerRect.top !== prevTriggerRect.top) {
        setActivationDirection(isMovingDown ? 'down' : 'up');
        return;
      }

      const order = previousReference.compareDocumentPosition(groupElement);
      if (order === Node.DOCUMENT_POSITION_FOLLOWING) {
        setActivationDirection('down');
      } else if (order === Node.DOCUMENT_POSITION_PRECEDING) {
        setActivationDirection('up');
      }
    }
  }

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

    if (isHover && !nextOpen && eventDetails.event instanceof MouseEvent) {
      const relatedTarget = eventDetails.event.relatedTarget as Node | null;
      const floatingElement = positionerElement || viewportElement;
      const movingWithinGroup = relatedTarget ? groupElement?.contains(relatedTarget) : false;
      const movingWithinFloating = relatedTarget ? floatingElement?.contains(relatedTarget) : false;
      const hoveringInteractiveRegion =
        groupElement?.matches(':hover') || floatingElement?.matches(':hover');

      if (movingWithinGroup || movingWithinFloating || hoveringInteractiveRegion) {
        return;
      }
    }

    function changeState() {
      if (nextOpen) {
        if (value != null && value !== itemValue) {
          setTransitionDirection();
        }
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
      reference: groupElement,
      floating: positionerElement || viewportElement,
    },
  });

  const hoverProps = useHoverReferenceInteraction(context, {
    move: false,
    handleClose: safePolygon({ blockPointerEvents: pointerType !== 'touch' }),
    restMs: mounted && positionerElement ? 0 : delay,
    delay: { close: closeDelay },
  });
  useHoverFloatingInteraction(context, { closeDelay });

  useIsoLayoutEffect(() => {
    if (isActiveItem) {
      setFloatingRootContext(context);
    }
  }, [context, isActiveItem, setFloatingRootContext]);

  const state: NavigationMenuTriggerGroup.State = {
    open: isActiveItem,
  };

  const defaultProps: HTMLProps = {
    [NAVIGATION_MENU_TRIGGER_GROUP_IDENTIFIER as string]: '',
    onMouseEnter(event) {
      if (pointerType === 'touch') {
        return;
      }

      if (value != null) {
        if (value !== itemValue) {
          setTransitionDirection();
        }
        setValue(itemValue, createChangeEventDetails(REASONS.triggerHover, event.nativeEvent));
      }
    },
    onPointerEnter(event) {
      setPointerType(event.pointerType);
    },
    onPointerDown(event) {
      setPointerType(event.pointerType);
    },
  };

  const element = useRenderElement('div', componentProps, {
    ref: [forwardedRef, setGroupElement],
    state,
    props: [
      hoverProps || EMPTY_OBJECT,
      dismissProps?.reference || EMPTY_OBJECT,
      defaultProps,
      elementProps,
    ],
    stateAttributesMapping: triggerOpenStateMapping,
  });

  return (
    <NavigationMenuTriggerGroupContext.Provider value={true}>
      {element}
    </NavigationMenuTriggerGroupContext.Provider>
  );
});

export interface NavigationMenuTriggerGroupState {
  /**
   * Whether the popup is open and the item is active.
   */
  open: boolean;
}

export interface NavigationMenuTriggerGroupProps extends BaseUIComponentProps<
  'div',
  NavigationMenuTriggerGroup.State
> {}

export namespace NavigationMenuTriggerGroup {
  export type State = NavigationMenuTriggerGroupState;
  export type Props = NavigationMenuTriggerGroupProps;
}
