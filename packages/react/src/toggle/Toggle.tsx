'use client';
import * as React from 'react';
import { useControlled } from '@base-ui/utils/useControlled';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { error } from '@base-ui/utils/error';
import { useBaseUiId } from '../internals/useBaseUiId';
import { useRenderElement } from '../internals/useRenderElement';
import type { NativeButtonComponentProps } from '../internals/types';
import { useToggleGroupContext } from '../toggle-group/ToggleGroupContext';
import { useButton } from '../internals/use-button/useButton';
import { CompositeItem } from '../internals/composite/item/CompositeItem';
import {
  type BaseUIChangeEventDetails,
  createChangeEventDetails,
} from '../internals/createBaseUIEventDetails';
import { REASONS } from '../internals/reasons';

/**
 * A two-state button that can be on or off.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Toggle](https://base-ui.com/react/components/toggle)
 */
export const Toggle = React.forwardRef(function Toggle<Value extends string>(
  componentProps: Toggle.Props<Value>,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const {
    className,
    defaultPressed: defaultPressedProp = false,
    disabled: disabledProp = false,
    form, // never participates in form validation
    onPressedChange,
    pressed: pressedProp,
    render,
    type, // cannot change button type
    value: valueProp,
    nativeButton = true,
    style,
    ...elementProps
  } = componentProps;

  // `|| undefined` handles cases, where value is falsy (i.e. "")
  const value = useBaseUiId(valueProp || undefined);
  const groupContext = useToggleGroupContext();
  const groupValue = groupContext?.value ?? [];

  const defaultPressed = groupContext ? undefined : defaultPressedProp;

  const disabled = (disabledProp || groupContext?.disabled) ?? false;

  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useIsoLayoutEffect(() => {
      if (groupContext && valueProp === undefined && groupContext.isValueInitialized) {
        error(
          'A `<Toggle>` component rendered in a `<ToggleGroup>` has no explicit `value` prop.',
          'This will cause issues between the Toggle Group and Toggle values.',
          'Provide the `<Toggle>` with a `value` prop matching the `<ToggleGroup>` values prop type.',
        );
      }
    }, [groupContext, valueProp, groupContext?.isValueInitialized]);
  }

  const [pressed, setPressedState] = useControlled({
    controlled: groupContext ? value !== undefined && groupValue.indexOf(value) > -1 : pressedProp,
    default: defaultPressed,
    name: 'Toggle',
    state: 'pressed',
  });

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    native: nativeButton,
  });

  const state: ToggleState = {
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

        if (value) {
          groupContext?.setGroupValue?.(value, nextPressed, details);
        }
        onPressedChange?.(nextPressed, details);

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
        style={style}
        state={state}
        refs={refs}
        props={props}
      />
    );
  }

  return element;
}) as unknown as ToggleComponent;

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

export type ToggleProps<
  Value extends string = string,
  TNativeButton extends boolean = true,
  TElement extends React.ElementType = 'button',
> = Omit<NativeButtonComponentProps<TNativeButton, TElement, Toggle.State>, 'disabled'> & {
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
  value?: Value | undefined;
};

export type ToggleChangeEventReason = typeof REASONS.none;

export type ToggleChangeEventDetails = BaseUIChangeEventDetails<Toggle.ChangeEventReason>;

export namespace Toggle {
  export type State = ToggleState;
  export type Props<
    Value extends string = string,
    TNativeButton extends boolean = true,
    TElement extends React.ElementType = 'button',
  > = ToggleProps<Value, TNativeButton, TElement>;
  export type ChangeEventReason = ToggleChangeEventReason;
  export type ChangeEventDetails = ToggleChangeEventDetails;
}

type ToggleComponent = {
  <Value extends string = string, TElement extends React.ElementType = 'button'>(
    props: Toggle.Props<Value, true, TElement> & { ref?: React.Ref<HTMLButtonElement> | undefined },
  ): React.ReactElement | null;
  <Value extends string = string, TElement extends React.ElementType = 'button'>(
    props: Toggle.Props<Value, false, TElement> & { nativeButton: false } & {
      ref?: React.Ref<HTMLElement> | undefined;
    },
  ): React.ReactElement | null;
  <Value extends string = string, TElement extends React.ElementType = 'button'>(
    props: Toggle.Props<Value, boolean, TElement> & { nativeButton: boolean } & {
      ref?: React.Ref<HTMLElement> | undefined;
    },
  ): React.ReactElement | null;
};
