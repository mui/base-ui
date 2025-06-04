'use client';
import * as React from 'react';
import { makeEventPreventable, mergeProps } from '../merge-props';
import { useModernLayoutEffect } from '../utils/useModernLayoutEffect';
import { useEventCallback } from '../utils/useEventCallback';
import { useCompositeRootContext } from '../composite/root/CompositeRootContext';
import { BaseUIEvent, HTMLProps } from '../utils/types';

export function useButton(parameters: useButton.Parameters = {}): useButton.ReturnValue {
  const { disabled = false, focusableWhenDisabled, tabIndex = 0, native = true } = parameters;

  const buttonRef = React.useRef<HTMLButtonElement | HTMLAnchorElement | HTMLElement | null>(null);

  const isCompositeItem = useCompositeRootContext(true) !== undefined;
  const isNativeButton = native === true;

  const isValidLink = useEventCallback(() => {
    const element = buttonRef.current;
    return Boolean(element?.tagName === 'A' && (element as HTMLAnchorElement)?.href);
  });

  const buttonProps = React.useMemo(() => {
    const additionalProps: AdditionalButtonProps = {};

    if (tabIndex !== undefined && !isCompositeItem) {
      additionalProps.tabIndex = tabIndex;
    }

    if (isNativeButton) {
      if (focusableWhenDisabled || (isCompositeItem && focusableWhenDisabled !== false)) {
        additionalProps['aria-disabled'] = disabled;
      } else if (!isCompositeItem) {
        additionalProps.disabled = disabled;
      }
    } else {
      if (!native) {
        additionalProps.role = 'button';
      }
      if (!isCompositeItem) {
        additionalProps.tabIndex = tabIndex ?? 0;
      }
      if (disabled) {
        additionalProps['aria-disabled'] = disabled as boolean;
        if (!isCompositeItem) {
          additionalProps.tabIndex = focusableWhenDisabled ? (tabIndex ?? 0) : -1;
        }
      }
    }

    return additionalProps;
  }, [disabled, focusableWhenDisabled, isCompositeItem, isNativeButton, native, tabIndex]);

  // handles a disabled composite button rendering another button, e.g.
  // <Toolbar.Button disabled render={<Menu.Trigger />} />
  // the `disabled` prop needs to pass through 2 `useButton`s then finally
  // delete the `disabled` attribute from DOM
  useModernLayoutEffect(() => {
    const element = buttonRef.current;
    if (!(element instanceof HTMLButtonElement)) {
      return;
    }

    if (isCompositeItem && disabled && buttonProps.disabled === undefined && element.disabled) {
      element.disabled = false;
    }
  }, [disabled, buttonProps.disabled, isCompositeItem]);

  const getButtonProps = React.useCallback(
    (externalProps: GenericButtonProps = {}) => {
      const {
        onClick: externalOnClick,
        onMouseDown: externalOnMouseDown,
        onKeyUp: externalOnKeyUp,
        onKeyDown: externalOnKeyDown,
        onPointerDown: externalOnPointerDown,
        ...otherExternalProps
      } = externalProps;

      let type: 'button' | 'text' | undefined;
      if (native === 'input') {
        type = 'text';
      } else if (isNativeButton) {
        type = 'button';
      }

      return mergeProps<'button' | 'input'>(
        {
          type,
          onClick(event: React.MouseEvent) {
            if (disabled) {
              event.preventDefault();
              return;
            }
            externalOnClick?.(event);
          },
          onMouseDown(event: React.MouseEvent) {
            if (!disabled) {
              externalOnMouseDown?.(event);
            }
          },
          onKeyDown(event: BaseUIEvent<React.KeyboardEvent>) {
            if (
              // allow Tabbing away from focusableWhenDisabled buttons
              (disabled && focusableWhenDisabled && event.key !== 'Tab') ||
              (event.target === event.currentTarget && !isNativeButton && event.key === ' ')
            ) {
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
              !isNativeButton &&
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
              !isNativeButton &&
              !disabled &&
              event.key === ' '
            ) {
              externalOnClick?.(event);
            }
          },
          onPointerDown(event: React.PointerEvent) {
            if (disabled) {
              event.preventDefault();
              return;
            }
            externalOnPointerDown?.(event);
          },
        },
        buttonProps,
        otherExternalProps,
      );
    },
    [buttonProps, disabled, focusableWhenDisabled, isNativeButton, isValidLink, native],
  );

  return {
    getButtonProps,
    buttonRef,
  };
}

interface GenericButtonProps extends Omit<HTMLProps, 'onClick'>, AdditionalButtonProps {
  onClick?: (event: React.SyntheticEvent) => void;
}

interface AdditionalButtonProps
  extends Partial<{
    'aria-disabled': React.AriaAttributes['aria-disabled'];
    disabled: boolean;
    role: React.AriaRole;
    tabIndex?: number;
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
    tabIndex?: NonNullable<React.HTMLAttributes<any>['tabIndex']>;
    /**
     * Whether the component is being rendered as a native button or specific native tag.
     * @default true
     */
    native?: boolean | 'input' | 'a';
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
    buttonRef: React.RefObject<HTMLElement | null>;
  }
}
