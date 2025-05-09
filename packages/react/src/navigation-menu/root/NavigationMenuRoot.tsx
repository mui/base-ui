'use client';
import * as React from 'react';
import {
  FloatingTree,
  useFloatingNodeId,
  useFloatingParentNodeId,
  type FloatingRootContext,
} from '@floating-ui/react';
import { activeElement, contains } from '@floating-ui/react/utils';
import { isHTMLElement } from '@floating-ui/utils/dom';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import {
  NavigationMenuRootContext,
  NavigationMenuTreeContext,
  useNavigationMenuRootContext,
} from './NavigationMenuRootContext';
import { useControlled, useTransitionStatus } from '../../utils';
import type { OpenChangeReason } from '../../utils/translateOpenChangeReason';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { useEventCallback } from '../../utils/useEventCallback';
import { ownerDocument } from '../../utils/owner';

/**
 * Groups all parts of the navigation menu.
 * Renders a `<nav>` element at the root, or `<div>` element when nested.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 */
export const NavigationMenuRoot = React.forwardRef(function NavigationMenuRoot(
  componentProps: NavigationMenuRoot.Props,
  forwardedRef: React.ForwardedRef<HTMLElement>,
) {
  const {
    open: openParam,
    defaultOpen = false,
    onOpenChange,
    onOpenChangeComplete,
    defaultValue,
    value: valueParam,
    onValueChange,
    actionsRef,
    delay = 50,
    closeDelay = 100,
    orientation = 'horizontal',
  } = componentProps;

  const nested = useFloatingParentNodeId() != null;

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
  const rootRef = React.useRef<HTMLDivElement | null>(null);

  const setOpen = useEventCallback(
    (nextOpen: boolean, event: Event | undefined, reason: OpenChangeReason | undefined) => {
      if (!nextOpen) {
        closeReasonRef.current = reason;
      }

      onOpenChange?.(nextOpen, event, reason);
      setOpenUnwrapped(nextOpen);
    },
  );

  const setValue = useEventCallback((nextValue: any) => {
    if (nextValue !== value) {
      onValueChange?.(nextValue);
    }
    setValueUnwrapped(nextValue);
  });

  const [positionerElement, setPositionerElement] = React.useState<HTMLElement | null>(null);
  const [popupElement, setPopupElement] = React.useState<HTMLElement | null>(null);
  const [viewportElement, setViewportElement] = React.useState<HTMLElement | null>(null);
  const [activationDirection, setActivationDirection] = React.useState<'left' | 'right' | null>(
    null,
  );
  const [floatingRootContext, setFloatingRootContext] = React.useState<
    FloatingRootContext | undefined
  >(undefined);

  const prevTriggerElementRef = React.useRef<Element | null | undefined>(null);
  const currentContentRef = React.useRef<HTMLDivElement | null>(null);
  const beforeInsideRef = React.useRef<HTMLSpanElement | null>(null);
  const afterInsideRef = React.useRef<HTMLSpanElement | null>(null);
  const beforeOutsideRef = React.useRef<HTMLSpanElement | null>(null);
  const afterOutsideRef = React.useRef<HTMLSpanElement | null>(null);

  const { mounted, setMounted, transitionStatus } = useTransitionStatus(open);

  const handleUnmount = useEventCallback(() => {
    const doc = ownerDocument(rootRef.current);
    const activeEl = activeElement(doc);

    if (
      closeReasonRef.current !== 'hover' &&
      isHTMLElement(prevTriggerElementRef.current) &&
      (contains(popupElement, activeEl) || activeEl === doc.body)
    ) {
      prevTriggerElementRef.current.focus({ preventScroll: true });
      prevTriggerElementRef.current = undefined;
    }

    setMounted(false);
    onOpenChangeComplete?.(false);
    setActivationDirection(null);
    setFloatingRootContext(undefined);

    currentContentRef.current = null;
    closeReasonRef.current = undefined;
  });

  useOpenChangeComplete({
    enabled: !actionsRef,
    open,
    ref: { current: popupElement },
    onComplete() {
      if (!open) {
        handleUnmount();
      }
    },
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
      activationDirection,
      setActivationDirection,
      floatingRootContext,
      setFloatingRootContext,
      currentContentRef,
      nested,
      rootRef,
      beforeInsideRef,
      afterInsideRef,
      beforeOutsideRef,
      afterOutsideRef,
      prevTriggerElementRef,
      delay,
      closeDelay,
      orientation,
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
      activationDirection,
      floatingRootContext,
      nested,
      delay,
      closeDelay,
      orientation,
    ],
  );

  const jsx = (
    <NavigationMenuRootContext.Provider value={contextValue}>
      <TreeContext componentProps={componentProps} forwardedRef={forwardedRef}>
        {componentProps.children}
      </TreeContext>
    </NavigationMenuRootContext.Provider>
  );

  if (!nested) {
    // FloatingTree provides context to nested menus
    return <FloatingTree>{jsx}</FloatingTree>;
  }

  return jsx;
});

function TreeContext(props: {
  componentProps: NavigationMenuRoot.Props;
  forwardedRef: React.ForwardedRef<HTMLElement>;
  children: React.ReactNode;
}) {
  const {
    className,
    render,
    open: openParam,
    defaultOpen,
    onOpenChange,
    onOpenChangeComplete,
    defaultValue,
    value: valueParam,
    onValueChange,
    actionsRef,
    delay,
    closeDelay,
    orientation,
    ...elementProps
  } = props.componentProps;

  const nodeId = useFloatingNodeId();
  const { rootRef, nested } = useNavigationMenuRootContext();

  const renderElement = useRenderElement(nested ? 'div' : 'nav', props.componentProps, {
    ref: [props.forwardedRef, rootRef],
    props: [{ 'aria-orientation': orientation }, elementProps],
  });

  return (
    <NavigationMenuTreeContext.Provider value={nodeId}>
      {renderElement()}
    </NavigationMenuTreeContext.Provider>
  );
}

export namespace NavigationMenuRoot {
  export interface State {}

  export interface Props extends BaseUIComponentProps<'nav', State> {
    /**
     * A ref to imperative actions.
     * - `unmount`: When specified, the navigation menu will not be unmounted when closed.
     * Instead, the `unmount` function must be called to unmount the navigation menu manually.
     * Useful when the navigation menu's animation is controlled by an external library.
     */
    actionsRef?: React.RefObject<{ unmount: () => void }>;
    /**
     * Whether the navigation menu is currently open.
     */
    open?: boolean;
    /**
     * Whether the navigation menu is initially open.
     *
     * To render a controlled menu, use the `open` prop instead.
     * @default false
     */
    defaultOpen?: boolean;
    /**
     * Event handler called when the navigation menu is opened or closed.
     */
    onOpenChange?: (open: boolean, event?: Event, reason?: OpenChangeReason) => void;
    /**
     * Event handler called after any animations complete when the navigation menu is closed.
     */
    onOpenChangeComplete?: (open: boolean) => void;
    /**
     * The controlled value of the navigation navigation menu item that should be currently open.
     *
     * To render an uncontrolled navigation navigation menu, use the `defaultValue` prop instead.
     * @default null
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
    /**
     * How long to wait before opening the navigation menu. Specified in milliseconds.
     * @default 50
     */
    delay?: number;
    /**
     * How long to wait before closing the navigation menu. Specified in milliseconds.
     * @default 100
     */
    closeDelay?: number;
    /**
     * The orientation of the navigation menu.
     * @default 'horizontal'
     */
    orientation?: 'horizontal' | 'vertical';
  }
}
