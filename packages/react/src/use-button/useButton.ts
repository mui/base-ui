'use client';
import * as React from 'react';
import { isHTMLElement } from '@floating-ui/utils/dom';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { error } from '@base-ui/utils/error';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { SafeReact } from '@base-ui/utils/safeReact';
import { makeEventPreventable, mergeProps } from '../merge-props';
import { useCompositeRootContext } from '../composite/root/CompositeRootContext';
import { BaseUIEvent, HTMLProps } from '../utils/types';
import { useFocusableWhenDisabled } from '../utils/useFocusableWhenDisabled';

export function useButton(parameters: useButton.Parameters = {}): useButton.ReturnValue {
  const {
    disabled = false,
    focusableWhenDisabled,
    tabIndex = 0,
    native: isNativeButton = true,
  } = parameters;

  const elementRef = React.useRef<HTMLElement | null>(null);

  const isCompositeItem = useCompositeRootContext(true) !== undefined;

  const isValidLink = useStableCallback(() => {
    const element = elementRef.current;
    return Boolean(element?.tagName === 'A' && (element as HTMLAnchorElement)?.href);
  });

  const { props: focusableWhenDisabledProps } = useFocusableWhenDisabled({
    focusableWhenDisabled,
    disabled,
    composite: isCompositeItem,
    tabIndex,
    isNativeButton,
  });

  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useEffect(() => {
      if (!elementRef.current) {
        return;
      }

      const isButtonTag = elementRef.current.tagName === 'BUTTON';

      if (isNativeButton) {
        if (!isButtonTag) {
          const ownerStackMessage = SafeReact.captureOwnerStack?.() || '';
          error(
            `A component that acts as a button was not rendered as a native <button>, which does not match the default. Ensure that the element passed to the \`render\` prop of the component is a real <button>, or set the \`nativeButton\` prop on the component to \`false\`.${ownerStackMessage}`,
          );
        }
      } else if (isButtonTag) {
        const ownerStackMessage = SafeReact.captureOwnerStack?.() || '';
        error(
          `A component that acts as a button was rendered as a native <button>, which does not match the default. Ensure that the element passed to the \`render\` prop of the component is not a real <button>, or set the \`nativeButton\` prop on the component to \`true\`.${ownerStackMessage}`,
        );
      }
    }, [isNativeButton]);
  }

  // handles a disabled composite button rendering another button, e.g.
  // <Toolbar.Button disabled render={<Menu.Trigger />} />
  // the `disabled` prop needs to pass through 2 `useButton`s then finally
  // delete the `disabled` attribute from DOM
  const updateDisabled = React.useCallback(() => {
    const element = elementRef.current;

    if (!isButtonElement(element)) {
      return;
    }

    if (
      isCompositeItem &&
      disabled &&
      focusableWhenDisabledProps.disabled === undefined &&
      element.disabled
    ) {
      element.disabled = false;
    }
  }, [disabled, focusableWhenDisabledProps.disabled, isCompositeItem]);

  useIsoLayoutEffect(updateDisabled, [updateDisabled]);

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

      const type = isNativeButton ? 'button' : undefined;

      return mergeProps<'button'>(
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
            if (!disabled) {
              makeEventPreventable(event);
              externalOnKeyDown?.(event);
            }

            if (event.baseUIHandlerPrevented) {
              return;
            }

            const shouldClick =
              event.target === event.currentTarget &&
              !isNativeButton &&
              !isValidLink() &&
              !disabled;
            const isEnterKey = event.key === 'Enter';
            const isSpaceKey = event.key === ' ';

            // Keyboard accessibility for non interactive elements
            if (shouldClick) {
              if (isSpaceKey || isEnterKey) {
                event.preventDefault();
              }

              if (isEnterKey) {
                externalOnClick?.(event);
              }
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
        !isNativeButton ? { role: 'button' } : undefined,
        focusableWhenDisabledProps,
        otherExternalProps,
      );
    },
    [disabled, focusableWhenDisabledProps, isNativeButton, isValidLink],
  );

  const buttonRef = useStableCallback((element: HTMLElement | null) => {
    elementRef.current = element;
    updateDisabled();
  });

  return {
    getButtonProps,
    buttonRef,
  };
}

function isButtonElement(
  elem: HTMLButtonElement | HTMLAnchorElement | HTMLElement | null,
): elem is HTMLButtonElement {
  return isHTMLElement(elem) && elem.tagName === 'BUTTON';
}

interface GenericButtonProps extends Omit<HTMLProps, 'onClick'>, AdditionalButtonProps {
  onClick?: ((event: React.SyntheticEvent) => void) | undefined;
}

interface AdditionalButtonProps extends Partial<{
  'aria-disabled': React.AriaAttributes['aria-disabled'];
  disabled: boolean;
  role: React.AriaRole;
  tabIndex?: number | undefined;
}> {}

export interface UseButtonParameters {
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * Whether the button may receive focus even if it is disabled.
   * @default false
   */
  focusableWhenDisabled?: boolean | undefined;
  tabIndex?: NonNullable<React.HTMLAttributes<any>['tabIndex']> | undefined;
  /**
   * Whether the component is being rendered as a native button.
   * @default true
   */
  native?: boolean | undefined;
}

export interface UseButtonReturnValue {
  /**
   * Resolver for the button props.
   * @param externalProps additional props for the button
   * @returns props that should be spread on the button
   */
  getButtonProps: (
    externalProps?: React.ComponentPropsWithRef<any>,
  ) => React.ComponentPropsWithRef<any>;
  /**
   * A ref to the button DOM element. This ref should be passed to the rendered element.
   * It is not a part of the props returned by `getButtonProps`.
   */
  buttonRef: React.Ref<HTMLElement>;
}

export namespace useButton {
  export type Parameters = UseButtonParameters;
  export type ReturnValue = UseButtonReturnValue;
}
