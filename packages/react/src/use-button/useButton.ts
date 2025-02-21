'use client';
import * as React from 'react';
import { useForkRef } from '../utils/useForkRef';
import { makeEventPreventable, mergeReactProps } from '../utils/mergeReactProps';
import { useEventCallback } from '../utils/useEventCallback';
import { useRootElementName } from '../utils/useRootElementName';
import { BaseUIEvent, GenericHTMLProps } from '../utils/types';

export function useButton(parameters: useButton.Parameters = {}): useButton.ReturnValue {
  const {
    buttonRef: externalRef,
    disabled = false,
    focusableWhenDisabled,
    tabIndex,
    type,
    elementName: elementNameProp,
  } = parameters;
  const buttonRef = React.useRef<HTMLButtonElement | HTMLAnchorElement | HTMLElement | null>(null);

  const { rootElementName: elementName, updateRootElementName } = useRootElementName({
    rootElementName: elementNameProp,
  });

  const isNativeButton = useEventCallback(() => {
    const element = buttonRef.current;

    return (
      elementName === 'BUTTON' ||
      (elementName === 'INPUT' &&
        ['button', 'submit', 'reset'].includes((element as HTMLInputElement)?.type))
    );
  });

  const isValidLink = useEventCallback(() => {
    const element = buttonRef.current;

    return Boolean(elementName === 'A' && (element as HTMLAnchorElement)?.href);
  });

  const mergedRef = useForkRef(updateRootElementName, externalRef, buttonRef);

  const buttonProps = React.useMemo(() => {
    const additionalProps: AdditionalButtonProps = {};

    if (tabIndex !== undefined) {
      additionalProps.tabIndex = tabIndex;
    }

    if (elementName === 'BUTTON' || elementName === 'INPUT') {
      if (focusableWhenDisabled) {
        additionalProps['aria-disabled'] = disabled;
      } else {
        additionalProps.disabled = disabled;
      }
    } else if (elementName !== '') {
      additionalProps.role = 'button';
      additionalProps.tabIndex = tabIndex ?? 0;
      if (disabled) {
        additionalProps['aria-disabled'] = disabled as boolean;
        additionalProps.tabIndex = focusableWhenDisabled ? (tabIndex ?? 0) : -1;
      }
    }

    return additionalProps;
  }, [disabled, elementName, focusableWhenDisabled, tabIndex]);

  const getButtonProps = React.useCallback(
    (externalProps: GenericButtonProps = {}): GenericButtonProps => {
      const {
        onClick: externalOnClick,
        onMouseDown: externalOnMouseDown,
        onKeyUp: externalOnKeyUp,
        onKeyDown: externalOnKeyDown,
        ...otherExternalProps
      } = externalProps;

      return mergeReactProps(otherExternalProps, buttonProps, {
        type,
        onClick(event: React.MouseEvent) {
          if (!disabled) {
            externalOnClick?.(event);
          }
        },
        onMouseDown(event: React.MouseEvent) {
          if (!disabled) {
            externalOnMouseDown?.(event);
          }
        },
        onKeyDown(event: BaseUIEvent<React.KeyboardEvent>) {
          if (event.target === event.currentTarget && !isNativeButton() && event.key === ' ') {
            event.preventDefault();
          }

          if (!disabled) {
            makeEventPreventable(event);
            externalOnKeyDown?.(event);
          }

          if (event.baseUIHandlerPrevented) {
            return;
          }

          // Keyboard accessibility for non interactive elements
          if (
            event.target === event.currentTarget &&
            !isNativeButton() &&
            !isValidLink() &&
            event.key === 'Enter' &&
            !disabled
          ) {
            externalOnClick?.(event);
            event.preventDefault();
          }
        },
        onKeyUp(event: BaseUIEvent<React.KeyboardEvent>) {
          // calling preventDefault in keyUp on a <button> will not dispatch a click event if Space is pressed
          // https://codesandbox.io/p/sandbox/button-keyup-preventdefault-dn7f0
          // Keyboard accessibility for non interactive elements
          if (!disabled) {
            makeEventPreventable(event);
            externalOnKeyUp?.(event);
          }

          if (event.baseUIHandlerPrevented) {
            return;
          }

          if (
            event.target === event.currentTarget &&
            !isNativeButton() &&
            !disabled &&
            event.key === ' '
          ) {
            externalOnClick?.(event);
          }
        },
        ref: mergedRef,
      });
    },
    [buttonProps, disabled, isNativeButton, isValidLink, mergedRef, type],
  );

  return {
    getButtonProps,
    buttonRef: mergedRef,
  };
}

interface GenericButtonProps extends Omit<GenericHTMLProps, 'onClick'>, AdditionalButtonProps {
  onClick?: (event: React.SyntheticEvent) => void;
}

interface AdditionalButtonProps
  extends Partial<{
    'aria-disabled': React.AriaAttributes['aria-disabled'];
    disabled: boolean;
    role: React.AriaRole;
    tabIndex: number;
  }> {}

export namespace useButton {
  export interface Parameters {
    /**
     * Whether the component should ignore user interaction.
     * @default false
     */
    disabled?: boolean;
    /**
     * Whether the button may receive focus even if it is disabled.
     * @default false
     */
    focusableWhenDisabled?: boolean;
    buttonRef?: React.Ref<Element>;
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
    elementName?: keyof HTMLElementTagNameMap;
  }

  export interface ReturnValue {
    /**
     * Resolver for the button props.
     * @param externalProps additional props for the button
     * @returns props that should be spread on the button
     */
    getButtonProps: (
      externalProps?: React.ComponentPropsWithRef<any>,
    ) => React.ComponentPropsWithRef<any>;
    /**
     * A ref to the button DOM element.
     */
    buttonRef: React.RefCallback<Element> | null;
  }
}
