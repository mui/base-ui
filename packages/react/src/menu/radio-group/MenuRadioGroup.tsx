'use client';
import * as React from 'react';
import { useControlled } from '@base-ui-components/utils/useControlled';
import { useEventCallback } from '@base-ui-components/utils/useEventCallback';
import { MenuRadioGroupContext } from './MenuRadioGroupContext';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { createBaseUIEventData, isEventPrevented } from '../../utils/createBaseUIEvent';
import type { MenuRoot } from '../root/MenuRoot';

/**
 * Groups related radio items.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export const MenuRadioGroup = React.memo(
  React.forwardRef(function MenuRadioGroup(
    componentProps: MenuRadioGroup.Props,
    forwardedRef: React.ForwardedRef<Element>,
  ) {
    const {
      render,
      className,
      value: valueProp,
      defaultValue,
      onValueChange: onValueChangeProp,
      disabled = false,
      ...elementProps
    } = componentProps;

    const [value, setValueUnwrapped] = useControlled({
      controlled: valueProp,
      default: defaultValue,
      name: 'MenuRadioGroup',
    });

    const onValueChange = useEventCallback(onValueChangeProp);

    const setValue = useEventCallback((newValue: any, event: Event) => {
      const data = createBaseUIEventData('item-press', event);

      onValueChange?.(newValue, data);

      if (isEventPrevented(data)) {
        return;
      }

      setValueUnwrapped(newValue);
    });

    const state = React.useMemo(() => ({ disabled }), [disabled]);

    const element = useRenderElement('div', componentProps, {
      state,
      ref: forwardedRef,
      props: {
        role: 'group',
        'aria-disabled': disabled || undefined,
        ...elementProps,
      },
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
      <MenuRadioGroupContext.Provider value={context}>{element}</MenuRadioGroupContext.Provider>
    );
  }),
);

export namespace MenuRadioGroup {
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
    onValueChange?: (value: any, data: MenuRoot.OpenChangeData) => void;
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
