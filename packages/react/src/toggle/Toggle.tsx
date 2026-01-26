'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useControlled } from '@base-ui/utils/useControlled';
import { useBaseUiId } from '../utils/useBaseUiId';
import { useRenderElement } from '../utils/useRenderElement';
import type { BaseUIComponentProps, NativeButtonProps } from '../utils/types';
import { useToggleGroupContext } from '../toggle-group/ToggleGroupContext';
import { useButton } from '../use-button/useButton';
import { CompositeItem } from '../composite/item/CompositeItem';
import {
  type BaseUIChangeEventDetails,
  createChangeEventDetails,
} from '../utils/createBaseUIEventDetails';
import { REASONS } from '../utils/reasons';

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

  // `|| undefined` handles cases, where value is falsy (i.e. "")
  const value = useBaseUiId(valueProp || undefined);
  const groupContext = useToggleGroupContext();
  const groupValue = groupContext?.value ?? [];

  const defaultPressed = groupContext ? undefined : defaultPressedProp;

  const disabled = (disabledProp || groupContext?.disabled) ?? false;

  const [pressed, setPressedState] = useControlled({
    controlled: groupContext ? value !== undefined && groupValue.indexOf(value) > -1 : pressedProp,
    default: defaultPressed,
    name: 'Toggle',
    state: 'pressed',
  });

  const onPressedChange = useStableCallback(
    (nextPressed: boolean, eventDetails: Toggle.ChangeEventDetails) => {
      if (value) {
        groupContext?.setGroupValue?.(value, nextPressed, eventDetails);
      }
      onPressedChangeProp?.(nextPressed, eventDetails);
    },
  );

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    native: nativeButton,
  });

  const state: Toggle.State = {
    disabled,
    pressed,
  };

  const refs = [buttonRef, forwardedRef];
  const props = [
    {
      'aria-pressed': pressed,
      onClick(event: React.MouseEvent) {
        const nextPressed = !pressed;
        const details = createChangeEventDetails(REASONS.none, event.nativeEvent);

        onPressedChange(nextPressed, details);

        if (details.isCanceled) {
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

export interface ToggleState {
  /**
   * Whether the toggle is currently pressed.
   */
  pressed: boolean;
  /**
   * Whether the toggle should ignore user interaction.
   */
  disabled: boolean;
}

export interface ToggleProps
  extends NativeButtonProps, BaseUIComponentProps<'button', Toggle.State> {
  /**
   * Whether the toggle button is currently pressed.
   * This is the controlled counterpart of `defaultPressed`.
   */
  pressed?: boolean | undefined;
  /**
   * Whether the toggle button is currently pressed.
   * This is the uncontrolled counterpart of `pressed`.
   * @default false
   */
  defaultPressed?: boolean | undefined;
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * Callback fired when the pressed state is changed.
   */
  onPressedChange?:
    | ((pressed: boolean, eventDetails: Toggle.ChangeEventDetails) => void)
    | undefined;
  /**
   * A unique string that identifies the toggle when used
   * inside a toggle group.
   */
  value?: string | undefined;
}

export type ToggleChangeEventReason = typeof REASONS.none;

export type ToggleChangeEventDetails = BaseUIChangeEventDetails<Toggle.ChangeEventReason>;

export namespace Toggle {
  export type State = ToggleState;
  export type Props = ToggleProps;
  export type ChangeEventReason = ToggleChangeEventReason;
  export type ChangeEventDetails = ToggleChangeEventDetails;
}
