'use client';
import * as React from 'react';
import { useControlled } from '@base-ui/utils/useControlled';
import { error } from '@base-ui/utils/error';
import { useBaseUiId } from '../../internals/useBaseUiId';
import { useRenderElement } from '../../internals/useRenderElement';
import type { BaseUIComponentProps, NativeButtonProps } from '../../internals/types';
import { useToggleGroupContext } from '../../toggle-group/ToggleGroupContext';
import type { ToolbarRoot } from '../../toolbar/root/ToolbarRoot';
import { useButton } from '../../internals/use-button/useButton';
import { CompositeItem } from '../../internals/composite/item/CompositeItem';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import type { BaseUIChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import { ToggleRootContext } from './ToggleRootContext';

/**
 * A two-state button that can be on or off.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Toggle](https://base-ui.com/react/components/toggle)
 */
export const ToggleRoot = React.forwardRef(function ToggleRoot<Value extends string>(
  componentProps: ToggleProps<Value>,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const {
    className,
    defaultPressed = false,
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

  const disabled = (disabledProp || groupContext?.disabled) ?? false;

  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useEffect(() => {
      if (groupContext && valueProp === undefined && groupContext.isValueInitialized) {
        error(
          'A `<Toggle.Root>` component rendered in a `<ToggleGroup>` has no explicit `value` prop.',
          'This will cause issues between the Toggle Group and Toggle values.',
          'Provide the `<Toggle.Root>` with a `value` prop matching the `<ToggleGroup>` values prop type.',
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

  const state: ToggleState = React.useMemo(() => ({ disabled, pressed }), [disabled, pressed]);

  const refs = [buttonRef, forwardedRef];
  const props = [
    {
      'aria-pressed': pressed,
      onClick(event: React.MouseEvent) {
        const nextPressed = !pressed;
        const details = createChangeEventDetails(REASONS.none, event.nativeEvent);

        // `onPressedChange` runs before the group commits so that canceling here
        // can also veto the group value change, which shares this `details` object.
        onPressedChange?.(nextPressed, details);

        if (details.isCanceled) {
          return;
        }

        if (value) {
          groupContext?.setGroupValue?.(value, nextPressed, details);
        }

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

  // A disabled toggle is natively disabled and cannot hold roving focus.
  // Toolbar reads this metadata to compute its `disabledIndices`.
  const itemMetadata: ToolbarRoot.ItemMetadata = React.useMemo(
    () => ({ disabled, focusableWhenDisabled: false }),
    [disabled],
  );

  if (groupContext) {
    return (
      <ToggleRootContext.Provider value={state}>
        <CompositeItem
          tag="button"
          render={render}
          className={className}
          style={style}
          metadata={itemMetadata}
          state={state}
          refs={refs}
          props={props}
        />
      </ToggleRootContext.Provider>
    );
  }

  return <ToggleRootContext.Provider value={state}>{element}</ToggleRootContext.Provider>;
}) as {
  <Value extends string>(
    props: ToggleProps<Value> & React.RefAttributes<HTMLButtonElement>,
  ): React.JSX.Element;
};

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

export interface ToggleProps<Value extends string>
  extends NativeButtonProps, BaseUIComponentProps<'button', ToggleState> {
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
    ((pressed: boolean, eventDetails: ToggleChangeEventDetails) => void) | undefined;
  /**
   * A unique string that identifies the toggle when used
   * inside a toggle group.
   */
  value?: Value | undefined;
}

export type ToggleChangeEventReason = typeof REASONS.none;

export type ToggleChangeEventDetails = BaseUIChangeEventDetails<ToggleChangeEventReason>;
