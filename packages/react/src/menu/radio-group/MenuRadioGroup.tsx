import * as React from 'react';
import { MenuRadioGroupContext } from './MenuRadioGroupContext';
import { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useControlled } from '../../utils/useControlled';
import { useEventCallback } from '../../utils/useEventCallback';

/**
 * Groups related radio items.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
const MenuRadioGroup = React.memo(
  React.forwardRef(function MenuRadioGroup(
    props: MenuRadioGroup.Props,
    forwardedRef: React.ForwardedRef<Element>,
  ) {
    const {
      render,
      className,
      value: valueProp,
      defaultValue,
      onValueChange: onValueChangeProp,
      disabled = false,
      ...other
    } = props;

    const [value, setValueUnwrapped] = useControlled({
      controlled: valueProp,
      default: defaultValue,
      name: 'MenuRadioGroup',
    });

    const onValueChange = useEventCallback(onValueChangeProp);

    const setValue = React.useCallback(
      (newValue: any, event: Event) => {
        setValueUnwrapped(newValue);
        onValueChange?.(newValue, event);
      },
      [onValueChange, setValueUnwrapped],
    );

    const state = React.useMemo(() => ({ disabled }), [disabled]);

    const { renderElement } = useComponentRenderer({
      render: render || 'div',
      className,
      state,
      extraProps: {
        role: 'group',
        'aria-disabled': disabled || undefined,
        ...other,
      },
      ref: forwardedRef,
    });

    const context: MenuRadioGroupContext = React.useMemo(
      () => ({
        value,
        setValue,
        disabled,
      }),
      [value, setValue, disabled],
    );

    return (
      <MenuRadioGroupContext.Provider value={context}>
        {renderElement()}
      </MenuRadioGroupContext.Provider>
    );
  }),
);

namespace MenuRadioGroup {
  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * The content of the component.
     */
    children?: React.ReactNode;
    /**
     * The controlled value of the radio item that should be currently selected.
     *
     * To render an uncontrolled radio group, use the `defaultValue` prop instead.
     */
    value?: any;
    /**
     * The uncontrolled value of the radio item that should be initially selected.
     *
     * To render a controlled radio group, use the `value` prop instead.
     */
    defaultValue?: any;
    /**
     * Function called when the selected value changes.
     *
     * @default () => {}
     */
    onValueChange?: (value: any, event: Event) => void;
    /**
     * Whether the component should ignore user interaction.
     *
     * @default false
     */
    disabled?: boolean;
  }

  export type State = {
    disabled: boolean;
  };
}

export { MenuRadioGroup };
