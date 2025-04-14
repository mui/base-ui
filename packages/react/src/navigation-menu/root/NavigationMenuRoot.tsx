'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { FloatingRootContext } from '@floating-ui/react';
import { activeElement, contains } from '@floating-ui/react/utils';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { NavigationMenuRootContext } from './NavigationMenuRootContext';
import { useControlled, useTransitionStatus } from '../../utils';
import type { OpenChangeReason } from '../../utils/translateOpenChangeReason';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { useEventCallback } from '../../utils/useEventCallback';
import { ownerDocument } from '../../utils/owner';

/**
 * Groups all parts of the navigation menu.
 * Renders a `<nav>` element.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 */
const NavigationMenuRoot = React.forwardRef(function NavigationMenuRoot(
  componentProps: NavigationMenuRoot.Props,
  forwardedRef: React.ForwardedRef<HTMLElement>,
) {
  const {
    className,
    render,
    open: openParam,
    defaultOpen = false,
    onOpenChange,
    onOpenChangeComplete,
    defaultValue,
    value: valueParam,
    onValueChange,
    ...elementProps
  } = componentProps;

  const [open, setOpenUnwrapped] = useControlled({
    controlled: openParam,
    default: defaultOpen,
    name: 'NavigationMenu',
    state: 'open',
  });

  const [value, setValueUnwrapped] = useControlled({
    controlled: valueParam,
    default: defaultValue,
    name: 'NavigationMenu',
    state: 'value',
  });

  const closeReasonRef = React.useRef<OpenChangeReason | undefined>(undefined);

  const setOpen = useEventCallback(
    (nextOpen: boolean, event?: Event, reason?: OpenChangeReason) => {
      if (!nextOpen) {
        closeReasonRef.current = reason;
      }

      onOpenChange?.(nextOpen, event, reason);
      setOpenUnwrapped(nextOpen);
    },
  );

  const setValue = useEventCallback((nextValue: any) => {
    onValueChange?.(nextValue);
    setValueUnwrapped(nextValue);
  });

  const [currentTriggerElement, setCurrentTriggerElement] = React.useState<HTMLElement | null>(
    null,
  );
  const [positionerElement, setPositionerElement] = React.useState<HTMLElement | null>(null);
  const [popupElement, setPopupElement] = React.useState<HTMLElement | null>(null);
  const [viewportElement, setViewportElement] = React.useState<HTMLElement | null>(null);
  const [activationDirection, setActivationDirection] = React.useState<'left' | 'right' | null>(
    null,
  );
  const [floatingRootContext, setFloatingRootContext] = React.useState<
    FloatingRootContext | undefined
  >(undefined);
  const currentContentRef = React.useRef<HTMLDivElement | null>(null);

  const { mounted, setMounted, transitionStatus } = useTransitionStatus(open);

  const handleUnmount = useEventCallback(() => {
    const doc = ownerDocument(popupElement);
    const activeEl = activeElement(doc);
    if (
      closeReasonRef.current === 'escape-key' &&
      (activeEl === doc.body || contains(popupElement, activeEl))
    ) {
      currentTriggerElement?.focus({ preventScroll: true });
    }

    setMounted(false);
    onOpenChangeComplete?.(false);
    currentContentRef.current = null;
    setActivationDirection(null);
    setCurrentTriggerElement(null);
    setFloatingRootContext(undefined);
  });

  useOpenChangeComplete({
    enabled: !componentProps.actionsRef,
    open,
    ref: { current: popupElement },
    onComplete() {
      if (!open) {
        handleUnmount();
      }
    },
  });

  const renderElement = useRenderElement('nav', componentProps, {
    ref: forwardedRef,
    props: [
      {
        onBlur(event) {
          if (
            !event.relatedTarget ||
            contains(event.currentTarget, event.relatedTarget) ||
            contains(popupElement, event.relatedTarget) ||
            event.relatedTarget?.hasAttribute('data-base-ui-focus-guard')
          ) {
            return;
          }

          setOpen(false);
        },
      },
      elementProps,
    ],
  });

  const contextValue: NavigationMenuRootContext = React.useMemo(
    () => ({
      open,
      setOpen,
      value,
      setValue,
      mounted,
      transitionStatus,
      positionerElement,
      setPositionerElement,
      popupElement,
      setPopupElement,
      viewportElement,
      setViewportElement,
      currentTriggerElement,
      setCurrentTriggerElement,
      activationDirection,
      setActivationDirection,
      floatingRootContext,
      setFloatingRootContext,
      currentContentRef,
    }),
    [
      open,
      setOpen,
      value,
      setValue,
      mounted,
      transitionStatus,
      positionerElement,
      popupElement,
      viewportElement,
      currentTriggerElement,
      activationDirection,
      floatingRootContext,
    ],
  );

  return (
    <NavigationMenuRootContext.Provider value={contextValue}>
      {renderElement()}
    </NavigationMenuRootContext.Provider>
  );
});

namespace NavigationMenuRoot {
  export interface State {}

  export interface Props extends BaseUIComponentProps<'nav', State> {
    /**
     * A ref to imperative actions.
     */
    actionsRef?: React.RefObject<{ unmount: () => void }>;
    /**
     * Whether the menu is currently open.
     */
    open?: boolean;
    /**
     * Whether the menu is initially open.
     *
     * To render a controlled menu, use the `open` prop instead.
     * @default false
     */
    defaultOpen?: boolean;
    /**
     * Event handler called when the menu is opened or closed.
     */
    onOpenChange?: (open: boolean, event?: Event, reason?: OpenChangeReason) => void;
    /**
     * Event handler called after any animations complete when the menu is closed.
     */
    onOpenChangeComplete?: (open: boolean) => void;

    /**
     * The controlled value of the navigation menu item that should be currently selected.
     *
     * To render an uncontrolled navigation menu, use the `defaultValue` prop instead.
     */
    value?: any;
    /**
     * The uncontrolled value of the item that should be initially selected.
     *
     * To render a controlled navigation menu, use the `value` prop instead.
     */
    defaultValue?: any;
    /**
     * Callback fired when the value changes.
     */
    onValueChange?: (value: any) => void;
  }
}

NavigationMenuRoot.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * A ref to imperative actions.
   */
  actionsRef: PropTypes.shape({
    current: PropTypes.shape({
      unmount: PropTypes.func.isRequired,
    }).isRequired,
  }),
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * CSS class applied to the element, or a function that
   * returns a class based on the component’s state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * Whether the menu is initially open.
   *
   * To render a controlled menu, use the `open` prop instead.
   * @default false
   */
  defaultOpen: PropTypes.bool,
  /**
   * The uncontrolled value of the item that should be initially selected.
   *
   * To render a controlled navigation menu, use the `value` prop instead.
   */
  defaultValue: PropTypes.any,
  /**
   * Event handler called when the menu is opened or closed.
   */
  onOpenChange: PropTypes.func,
  /**
   * Event handler called after any animations complete when the menu is closed.
   */
  onOpenChangeComplete: PropTypes.func,
  /**
   * Callback fired when the value changes.
   */
  onValueChange: PropTypes.func,
  /**
   * Whether the menu is currently open.
   */
  open: PropTypes.bool,
  /**
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   *
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  /**
   * The controlled value of the navigation menu item that should be currently selected.
   *
   * To render an uncontrolled navigation menu, use the `defaultValue` prop instead.
   */
  value: PropTypes.any,
} as any;

export { NavigationMenuRoot };
