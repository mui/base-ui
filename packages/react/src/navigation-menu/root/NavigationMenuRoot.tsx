'use client';
import * as React from 'react';
import { isHTMLElement } from '@floating-ui/utils/dom';
import { useControlled } from '@base-ui/utils/useControlled';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { ownerDocument } from '@base-ui/utils/owner';
import {
  FloatingNode,
  FloatingTree,
  useFloatingNodeId,
  useFloatingParentNodeId,
  type FloatingRootContext,
} from '../../floating-ui-react';
import { activeElement, contains } from '../../floating-ui-react/utils';
import { useRenderElement } from '../../utils/useRenderElement';
import {
  type NavigationMenuPopupAutoSizeResetState,
  NavigationMenuRootContext,
  NavigationMenuTreeContext,
  useNavigationMenuRootContext,
} from './NavigationMenuRootContext';
import type { BaseUIComponentProps } from '../../utils/types';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { useTransitionStatus } from '../../utils/useTransitionStatus';
import { getCssDimensions } from '../../utils/getCssDimensions';
import { type BaseUIChangeEventDetails } from '../../utils/createBaseUIEventDetails';
import { REASONS } from '../../utils/reasons';
import { NavigationMenuPopupCssVars } from '../popup/NavigationMenuPopupCssVars';
import { NavigationMenuPositionerCssVars } from '../positioner/NavigationMenuPositionerCssVars';

const blockedReturnFocusReasons = new Set<string>([
  REASONS.triggerHover,
  REASONS.outsidePress,
  REASONS.focusOut,
]);

function setSharedFixedSize(popupElement: HTMLElement, positionerElement: HTMLElement) {
  const { width, height } = getCssDimensions(popupElement);

  if (width === 0 || height === 0) {
    return;
  }

  popupElement.style.setProperty(NavigationMenuPopupCssVars.popupWidth, `${width}px`);
  popupElement.style.setProperty(NavigationMenuPopupCssVars.popupHeight, `${height}px`);
  positionerElement.style.setProperty(
    NavigationMenuPositionerCssVars.positionerWidth,
    `${width}px`,
  );
  positionerElement.style.setProperty(
    NavigationMenuPositionerCssVars.positionerHeight,
    `${height}px`,
  );
}

/**
 * Groups all parts of the navigation menu.
 * Renders a `<nav>` element at the root, or `<div>` element when nested.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 */
export const NavigationMenuRoot = React.forwardRef(function NavigationMenuRoot<Value = any>(
  componentProps: NavigationMenuRoot.Props<Value>,
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
  const parentRootContext = useNavigationMenuRootContext(true);

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
  // Shared across triggers so a newly active trigger can cancel a stale
  // popup auto-size reset scheduled by the previously active trigger.
  const popupAutoSizeResetRef = React.useRef<NavigationMenuPopupAutoSizeResetState>({
    abortController: null,
    owner: null,
  });

  const { mounted, setMounted, transitionStatus } = useTransitionStatus(open);

  React.useEffect(() => {
    setViewportInert(false);
  }, [value]);

  const setValue = useStableCallback(
    (
      nextValue: NavigationMenuRoot.Value<Value>,
      eventDetails: NavigationMenuRoot.ChangeEventDetails,
    ) => {
      if (!nextValue) {
        closeReasonRef.current = eventDetails.reason;
        setActivationDirection(null);
        setFloatingRootContext(undefined);

        if (positionerElement && popupElement) {
          setSharedFixedSize(popupElement, positionerElement);
        }
      }

      if (nextValue !== value) {
        onValueChange?.(nextValue, eventDetails);
      }

      if (eventDetails.isCanceled) {
        return;
      }

      setValueUnwrapped(nextValue);

      if (nested && !nextValue && eventDetails.reason === REASONS.linkPress && parentRootContext) {
        parentRootContext.setValue(null, eventDetails);
      }
    },
  );

  const handleUnmount = useStableCallback(() => {
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

  const contextValue: NavigationMenuRootContext<Value> = React.useMemo(
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
      popupAutoSizeResetRef,
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
}) as {
  <Value = any>(props: NavigationMenuRoot.Props<Value>): React.JSX.Element;
};

function TreeContext<Value>(props: {
  componentProps: NavigationMenuRoot.Props<Value>;
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
    style,
    ...elementProps
  } = props.componentProps;

  const nodeId = useFloatingNodeId();
  const { rootRef, nested } = useNavigationMenuRootContext();

  const { open } = useNavigationMenuRootContext();

  const state: NavigationMenuRootState = {
    open,
    nested,
  };

  const element = useRenderElement(nested ? 'div' : 'nav', props.componentProps, {
    state,
    ref: [props.forwardedRef, rootRef],
    props: elementProps,
  });

  return (
    <NavigationMenuTreeContext.Provider value={nodeId}>
      <FloatingNode id={nodeId}>{element}</FloatingNode>
    </NavigationMenuTreeContext.Provider>
  );
}

export interface NavigationMenuRootState {
  /**
   * If `true`, the popup is open.
   */
  open: boolean;
  /**
   * Whether the navigation menu is nested.
   */
  nested: boolean;
}

export interface NavigationMenuRootProps<Value = any> extends BaseUIComponentProps<
  'nav',
  NavigationMenuRootState
> {
  /**
   * A ref to imperative actions.
   */
  actionsRef?: React.RefObject<NavigationMenuRoot.Actions | null> | undefined;
  /**
   * Event handler called after any animations complete when the navigation menu is closed.
   */
  onOpenChangeComplete?: ((open: boolean) => void) | undefined;
  /**
   * The controlled value of the navigation menu item that should be currently open.
   * When non-nullish, the menu will be open. When nullish, the menu will be closed.
   *
   * To render an uncontrolled navigation menu, use the `defaultValue` prop instead.
   * @default null
   */
  value?: Value | null | undefined;
  /**
   * The uncontrolled value of the item that should be initially selected.
   *
   * To render a controlled navigation menu, use the `value` prop instead.
   * @default null
   */
  defaultValue?: Value | null | undefined;
  /**
   * Callback fired when the value changes.
   */
  onValueChange?:
    | ((value: Value | null, eventDetails: NavigationMenuRoot.ChangeEventDetails) => void)
    | undefined;
  /**
   * How long to wait before opening the navigation popup. Specified in milliseconds.
   * @default 50
   */
  delay?: number | undefined;
  /**
   * How long to wait before closing the navigation popup. Specified in milliseconds.
   * @default 50
   */
  closeDelay?: number | undefined;
  /**
   * The orientation of the navigation menu.
   * @default 'horizontal'
   */
  orientation?: 'horizontal' | 'vertical' | undefined;
}

export interface NavigationMenuRootActions {
  unmount: () => void;
}

export type NavigationMenuRootChangeEventReason =
  | typeof REASONS.triggerPress
  | typeof REASONS.triggerHover
  | typeof REASONS.outsidePress
  | typeof REASONS.listNavigation
  | typeof REASONS.focusOut
  | typeof REASONS.escapeKey
  | typeof REASONS.linkPress
  | typeof REASONS.none;

export type NavigationMenuRootChangeEventDetails =
  BaseUIChangeEventDetails<NavigationMenuRoot.ChangeEventReason>;

export namespace NavigationMenuRoot {
  export type State = NavigationMenuRootState;
  export type Props<TValue = any> = NavigationMenuRootProps<TValue>;
  export type Value<TValue = any> = TValue | null;
  export type Actions = NavigationMenuRootActions;
  export type ChangeEventReason = NavigationMenuRootChangeEventReason;
  export type ChangeEventDetails = NavigationMenuRootChangeEventDetails;
}
