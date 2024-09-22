'use client';
import * as React from 'react';
import { useForkRef } from '../utils/useForkRef';
import { extractEventHandlers } from '../utils/extractEventHandlers';
import { useRootElementName } from '../utils/useRootElementName';
import { EventHandlers } from '../utils/types';
import { MuiCancellableEvent } from '../utils/MuiCancellableEvent';

export function useButton(parameters: useButton.Parameters = {}): useButton.ReturnValue {
  const {
    disabled = false,
    focusableWhenDisabled,
    rootRef: externalRef,
    tabIndex,
    type,
    rootElementName: rootElementNameProp,
  } = parameters;
  const buttonRef = React.useRef<HTMLButtonElement | HTMLAnchorElement | HTMLElement | null>(null);

  const [rootElementName, updateRootElementName] = useRootElementName({
    rootElementName: rootElementNameProp,
    componentName: 'Button',
  });

  const isNativeButton = () => {
    const button = buttonRef.current;

    return (
      rootElementName === 'BUTTON' ||
      (rootElementName === 'INPUT' &&
        ['button', 'submit', 'reset'].includes((button as HTMLInputElement)?.type))
    );
  };

  const createHandleClick = (otherHandlers: EventHandlers) => (event: React.MouseEvent) => {
    if (!disabled) {
      otherHandlers.onClick?.(event);
    }
  };

  const createHandleKeyDown =
    (otherHandlers: EventHandlers) => (event: React.KeyboardEvent & MuiCancellableEvent) => {
      otherHandlers.onKeyDown?.(event);

      if (event.defaultMuiPrevented) {
        return;
      }

      if (event.target === event.currentTarget && !isNativeButton() && event.key === ' ') {
        event.preventDefault();
      }

      // Keyboard accessibility for non interactive elements
      if (
        event.target === event.currentTarget &&
        !isNativeButton() &&
        event.key === 'Enter' &&
        !disabled
      ) {
        otherHandlers.onClick?.(event);
        event.preventDefault();
      }
    };

  const createHandleKeyUp =
    (otherHandlers: EventHandlers) => (event: React.KeyboardEvent & MuiCancellableEvent) => {
      // calling preventDefault in keyUp on a <button> will not dispatch a click event if Space is pressed
      // https://codesandbox.io/p/sandbox/button-keyup-preventdefault-dn7f0

      otherHandlers.onKeyUp?.(event);

      // Keyboard accessibility for non interactive elements
      if (
        event.target === event.currentTarget &&
        !isNativeButton() &&
        !disabled &&
        event.key === ' ' &&
        !event.defaultMuiPrevented
      ) {
        otherHandlers.onClick?.(event);
      }
    };

  const handleRef = useForkRef(updateRootElementName, externalRef, buttonRef);

  interface AdditionalButtonProps {
    type?: React.ButtonHTMLAttributes<HTMLButtonElement>['type'];
    disabled?: boolean;
    role?: React.AriaRole;
    'aria-disabled'?: React.AriaAttributes['aria-disabled'];
    tabIndex?: number;
  }

  const buttonProps: AdditionalButtonProps = {};

  if (tabIndex !== undefined) {
    buttonProps.tabIndex = tabIndex;
  }

  if (rootElementName === 'BUTTON' || rootElementName === 'INPUT') {
    if (focusableWhenDisabled) {
      buttonProps['aria-disabled'] = disabled;
    } else {
      buttonProps.disabled = disabled;
    }
  } else if (rootElementName !== '') {
    buttonProps.role = 'button';
    buttonProps.tabIndex = tabIndex ?? 0;
    if (disabled) {
      buttonProps['aria-disabled'] = disabled as boolean;
      buttonProps.tabIndex = focusableWhenDisabled ? tabIndex ?? 0 : -1;
    }
  }

  const getRootProps = (
    externalProps: React.ComponentPropsWithRef<any>,
  ): React.ComponentPropsWithRef<any> => {
    const externalEventHandlers = {
      ...extractEventHandlers(parameters),
      ...extractEventHandlers(externalProps),
    };

    const props = {
      type,
      ...externalEventHandlers,
      ...buttonProps,
      ...externalProps,
      onClick: createHandleClick(externalEventHandlers),
      onKeyDown: createHandleKeyDown(externalEventHandlers),
      onKeyUp: createHandleKeyUp(externalEventHandlers),
      ref: handleRef,
    };

    return props;
  };

  return {
    getRootProps,
    rootRef: handleRef,
  };
}

export namespace useButton {
  export interface Parameters {
    /**
     * If `true`, the component is disabled.
     * @default false
     */
    disabled?: boolean;
    /**
     * If `true`, allows a disabled button to receive focus.
     * @default false
     */
    focusableWhenDisabled?: boolean;
    rootRef?: React.Ref<Element>;
    tabIndex?: NonNullable<React.HTMLAttributes<any>['tabIndex']>;
    /**
     * Type attribute applied when the `component` is `button`.
     * @default 'button'
     */
    type?: React.ButtonHTMLAttributes<HTMLButtonElement>['type'];
    /**
     * The HTML element, e.g.'button', 'span' etc.
     * @default ''
     */
    rootElementName?: keyof HTMLElementTagNameMap;
  }

  export interface ReturnValue {
    /**
     * Resolver for the root slot's props.
     * @param externalProps additional props for the root slot
     * @returns props that should be spread on the root slot
     */
    getRootProps: (
      externalProps?: React.ComponentPropsWithRef<any>,
    ) => React.ComponentPropsWithRef<any>;
    /**
     * A ref to the component's root DOM element.
     */
    rootRef: React.RefCallback<Element> | null;
  }
}
