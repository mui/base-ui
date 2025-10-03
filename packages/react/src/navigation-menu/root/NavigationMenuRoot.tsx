'use client';
import * as React from 'react';
import { isHTMLElement } from '@floating-ui/utils/dom';
import { useControlled } from '@base-ui-components/utils/useControlled';
import { useEventCallback } from '@base-ui-components/utils/useEventCallback';
import { ownerDocument } from '@base-ui-components/utils/owner';
import {
  FloatingTree,
  useFloatingNodeId,
  useFloatingParentNodeId,
  type FloatingRootContext,
} from '../../floating-ui-react';
import { activeElement, contains } from '../../floating-ui-react/utils';
import { useRenderElement } from '../../utils/useRenderElement';
import {
  NavigationMenuRootContext,
  NavigationMenuTreeContext,
  useNavigationMenuRootContext,
} from './NavigationMenuRootContext';
import type { BaseUIComponentProps } from '../../utils/types';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { useTransitionStatus } from '../../utils/useTransitionStatus';
import { setFixedSize } from '../utils/setFixedSize';
import { BaseUIChangeEventDetails } from '../../utils/createBaseUIEventDetails';

const blockedReturnFocusReasons = new Set<string>(['trigger-hover', 'outside-press', 'focus-out']);

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
    defaultValue = null,
    value: valueParam,
    onValueChange,
    actionsRef,
    delay = 50,
    closeDelay = 50,
    orientation = 'horizontal',
    onOpenChangeComplete,
  } = componentProps;

  const nested = useFloatingParentNodeId() != null;

  const [value, setValueUnwrapped] = useControlled({
    controlled: valueParam,
    default: defaultValue,
    name: 'NavigationMenu',
    state: 'value',
  });

  // Derive open state from value being non-nullish
  const open = value != null;

  const closeReasonRef = React.useRef<NavigationMenuRoot.ChangeEventReason | undefined>(undefined);
  const rootRef = React.useRef<HTMLDivElement | null>(null);

  const [positionerElement, setPositionerElement] = React.useState<HTMLElement | null>(null);
  const [popupElement, setPopupElement] = React.useState<HTMLElement | null>(null);
  const [viewportElement, setViewportElement] = React.useState<HTMLElement | null>(null);
  const [viewportTargetElement, setViewportTargetElement] = React.useState<HTMLElement | null>(
    null,
  );
  const [activationDirection, setActivationDirection] =
    React.useState<NavigationMenuRootContext['activationDirection']>(null);
  const [floatingRootContext, setFloatingRootContext] = React.useState<
    FloatingRootContext | undefined
  >(undefined);
  const [viewportInert, setViewportInert] = React.useState(false);

  const prevTriggerElementRef = React.useRef<Element | null | undefined>(null);
  const currentContentRef = React.useRef<HTMLDivElement | null>(null);
  const beforeInsideRef = React.useRef<HTMLSpanElement | null>(null);
  const afterInsideRef = React.useRef<HTMLSpanElement | null>(null);
  const beforeOutsideRef = React.useRef<HTMLSpanElement | null>(null);
  const afterOutsideRef = React.useRef<HTMLSpanElement | null>(null);

  const { mounted, setMounted, transitionStatus } = useTransitionStatus(open);

  React.useEffect(() => {
    setViewportInert(false);
  }, [value]);

  const setValue = useEventCallback(
    (nextValue: any, eventDetails: NavigationMenuRoot.ChangeEventDetails) => {
      if (!nextValue) {
        closeReasonRef.current = eventDetails.reason;
        setActivationDirection(null);
        setFloatingRootContext(undefined);

        if (positionerElement && popupElement) {
          setFixedSize(popupElement, 'popup');
          setFixedSize(positionerElement, 'positioner');
        }
      }

      if (nextValue !== value) {
        onValueChange?.(nextValue, eventDetails);
      }

      if (eventDetails.isCanceled) {
        return;
      }

      setValueUnwrapped(nextValue);
    },
  );

  const handleUnmount = useEventCallback(() => {
    const doc = ownerDocument(rootRef.current);
    const activeEl = activeElement(doc);

    const isReturnFocusBlocked = closeReasonRef.current
      ? blockedReturnFocusReasons.has(closeReasonRef.current)
      : false;

    if (
      !isReturnFocusBlocked &&
      isHTMLElement(prevTriggerElementRef.current) &&
      (activeEl === ownerDocument(popupElement).body || contains(popupElement, activeEl)) &&
      popupElement
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

  useOpenChangeComplete({
    enabled: !actionsRef,
    open,
    ref: { current: viewportTargetElement },
    onComplete() {
      if (!open) {
        handleUnmount();
      }
    },
  });

  const contextValue: NavigationMenuRootContext = React.useMemo(
    () => ({
      open,
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
      viewportTargetElement,
      setViewportTargetElement,
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
      viewportInert,
      setViewportInert,
    }),
    [
      open,
      value,
      setValue,
      mounted,
      transitionStatus,
      positionerElement,
      popupElement,
      viewportElement,
      viewportTargetElement,
      activationDirection,
      floatingRootContext,
      nested,
      delay,
      closeDelay,
      orientation,
      viewportInert,
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
    defaultValue,
    value: valueParam,
    onValueChange,
    actionsRef,
    delay,
    closeDelay,
    orientation,
    onOpenChangeComplete,
    ...elementProps
  } = props.componentProps;

  const nodeId = useFloatingNodeId();
  const { rootRef, nested } = useNavigationMenuRootContext();

  const { open } = useNavigationMenuRootContext();

  const state: NavigationMenuRoot.State = React.useMemo(
    () => ({
      open,
      nested,
    }),
    [open, nested],
  );

  const element = useRenderElement(nested ? 'div' : 'nav', props.componentProps, {
    state,
    ref: [props.forwardedRef, rootRef],
    props: [{ 'aria-orientation': orientation }, elementProps],
  });

  return (
    <NavigationMenuTreeContext.Provider value={nodeId}>
      {element}
    </NavigationMenuTreeContext.Provider>
  );
}

export interface NavigationMenuRootState {
  open: boolean;
  nested: boolean;
}
export interface NavigationMenuRootProps
  extends BaseUIComponentProps<'nav', NavigationMenuRootState> {
  actionsRef?: React.RefObject<NavigationMenuRootActions>;
  onOpenChangeComplete?: (open: boolean) => void;
  value?: any;
  defaultValue?: any;
  onValueChange?: (value: any, eventDetails: NavigationMenuRootChangeEventDetails) => void;
  delay?: number;
  closeDelay?: number;
  orientation?: 'horizontal' | 'vertical';
}
export interface NavigationMenuRootActions {
  unmount: () => void;
}
export type NavigationMenuRootChangeEventReason =
  | 'trigger-press'
  | 'trigger-hover'
  | 'outside-press'
  | 'list-navigation'
  | 'focus-out'
  | 'escape-key'
  | 'link-press'
  | 'none';
export type NavigationMenuRootChangeEventDetails =
  BaseUIChangeEventDetails<NavigationMenuRootChangeEventReason>;

export namespace NavigationMenuRoot {
  export type State = NavigationMenuRootState;
  export type Props = NavigationMenuRootProps;
  export type Actions = NavigationMenuRootActions;
  export type ChangeEventReason = NavigationMenuRootChangeEventReason;
  export type ChangeEventDetails = NavigationMenuRootChangeEventDetails;
}
