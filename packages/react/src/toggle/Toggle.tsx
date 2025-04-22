'use client';
import * as React from 'react';
import { NOOP } from '../utils/noop';
import { useComponentRenderer } from '../utils/useComponentRenderer';
import type { BaseUIComponentProps } from '../utils/types';
import { CompositeItem } from '../composite/item/CompositeItem';
import { useToggleGroupContext } from '../toggle-group/ToggleGroupContext';
import { useToggle } from './useToggle';

/**
 * A two-state button that can be on or off.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Toggle](https://base-ui.com/react/components/toggle)
 */
const Toggle = React.forwardRef(function Toggle(
  props: Toggle.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const {
    className,
    defaultPressed = false,
    disabled: disabledProp = false,
    form, // never participates in form validation
    onPressedChange: onPressedChangeProp,
    pressed: pressedProp,
    render,
    type, // cannot change button type
    value: valueProp,
    ...otherProps
  } = props;

  const groupContext = useToggleGroupContext();

  const groupValue = groupContext?.value ?? [];

  const { disabled, pressed, getRootProps } = useToggle({
    buttonRef: forwardedRef,
    defaultPressed: groupContext ? undefined : defaultPressed,
    disabled: (disabledProp || groupContext?.disabled) ?? false,
    onPressedChange: onPressedChangeProp ?? NOOP,
    pressed: groupContext && valueProp ? groupValue?.indexOf(valueProp) > -1 : pressedProp,
    setGroupValue: groupContext?.setGroupValue ?? NOOP,
    value: valueProp ?? '',
  });

  const state: Toggle.State = React.useMemo(
    () => ({
      disabled,
      pressed,
    }),
    [disabled, pressed],
  );

  const { renderElement } = useComponentRenderer({
    propGetter: getRootProps,
    render: render ?? 'button',
    ref: forwardedRef,
    state,
    className,
    extraProps: otherProps,
  });

  return groupContext ? <CompositeItem render={renderElement()} /> : renderElement();
});

export { Toggle };

namespace Toggle {
  export interface State {
    pressed: boolean;
    /**
     * Whether the component should ignore user interaction.
     */
    disabled: boolean;
  }

  export interface Props
    extends Partial<
        Pick<
          useToggle.Parameters,
          'pressed' | 'defaultPressed' | 'disabled' | 'onPressedChange' | 'value'
        >
      >,
      Omit<BaseUIComponentProps<'button', State>, 'value'> {}
}
