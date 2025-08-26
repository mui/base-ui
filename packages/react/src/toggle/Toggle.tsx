'use client';
import * as React from 'react';
import { useEventCallback } from '@base-ui-components/utils/useEventCallback';
import { useControlled } from '@base-ui-components/utils/useControlled';
import { useRenderElement } from '../utils/useRenderElement';
import type { BaseUIComponentProps, NativeButtonProps } from '../utils/types';
import { useToggleGroupContext } from '../toggle-group/ToggleGroupContext';
import { useButton } from '../use-button/useButton';
import { CompositeItem } from '../composite/item/CompositeItem';
import { BaseUIEventDetails, createBaseUIEventDetails } from '../utils/createBaseUIEventDetails';

/**
 * A two-state button that can be on or off.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Toggle](https://base-ui.com/react/components/toggle)
 */
export const Toggle = React.forwardRef(function Toggle(
  componentProps: Toggle.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const {
    className,
    defaultPressed: defaultPressedProp = false,
    disabled: disabledProp = false,
    form, // never participates in form validation
    onPressedChange: onPressedChangeProp,
    pressed: pressedProp,
    render,
    type, // cannot change button type
    value: valueProp,
    nativeButton = true,
    ...elementProps
  } = componentProps;

  const value = valueProp ?? '';

  const groupContext = useToggleGroupContext();

  const groupValue = groupContext?.value ?? [];

  const defaultPressed = groupContext ? undefined : defaultPressedProp;

  const disabled = (disabledProp || groupContext?.disabled) ?? false;

  const [pressed, setPressedState] = useControlled({
    controlled: groupContext && value ? groupValue?.indexOf(value) > -1 : pressedProp,
    default: defaultPressed,
    name: 'Toggle',
    state: 'pressed',
  });

  const onPressedChange = useEventCallback(
    (nextPressed: boolean, eventDetails: Toggle.ChangeEventDetails) => {
      groupContext?.setGroupValue?.(value, nextPressed, eventDetails.event);
      onPressedChangeProp?.(nextPressed, eventDetails);
    },
  );

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    native: nativeButton,
  });

  const state: Toggle.State = React.useMemo(
    () => ({
      disabled,
      pressed,
    }),
    [disabled, pressed],
  );

  const refs = [buttonRef, forwardedRef];
  const props = [
    {
      'aria-pressed': pressed,
      onClick(event: React.MouseEvent) {
        const nextPressed = !pressed;
        const data = createBaseUIEventDetails('none', event.nativeEvent);

        onPressedChange(nextPressed, data);

        if (data.isCanceled) {
          return;
        }

        setPressedState(nextPressed);
      },
    },
    elementProps,
    getButtonProps,
  ];

  const element = useRenderElement('button', componentProps, {
    enabled: !groupContext,
    state,
    ref: refs,
    props,
  });

  if (groupContext) {
    return (
      <CompositeItem
        tag="button"
        render={render}
        className={className}
        state={state}
        refs={refs}
        props={props}
      />
    );
  }

  return element;
});

export namespace Toggle {
  export interface State {
    /**
     * Whether the toggle is currently pressed.
     */
    pressed: boolean;
    /**
     * Whether the toggle should ignore user interaction.
     */
    disabled: boolean;
  }

  export interface Props extends NativeButtonProps, BaseUIComponentProps<'button', State> {
    /**
     * Whether the toggle button is currently pressed.
     * This is the controlled counterpart of `defaultPressed`.
     */
    pressed?: boolean;
    /**
     * Whether the toggle button is currently pressed.
     * This is the uncontrolled counterpart of `pressed`.
     * @default false
     */
    defaultPressed?: boolean;
    /**
     * Whether the component should ignore user interaction.
     * @default false
     */
    disabled?: boolean;
    /**
     * Callback fired when the pressed state is changed.
     *
     * @param {boolean} pressed The new pressed state.
     * @param {Event} event The corresponding event that initiated the change.
     */
    onPressedChange?: (pressed: boolean, eventDetails: ChangeEventDetails) => void;
    /**
     * A unique string that identifies the toggle when used
     * inside a toggle group.
     */
    value?: string;
  }

  export type ChangeEventReason = 'none';
  export type ChangeEventDetails = BaseUIEventDetails<ChangeEventReason>;
}
