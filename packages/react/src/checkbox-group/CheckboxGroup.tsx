'use client';
import * as React from 'react';
import { useComponentRenderer } from '../utils/useComponentRenderer';
import { useCheckboxGroup } from './useCheckboxGroup';
import { CheckboxGroupContext } from './CheckboxGroupContext';
import type { FieldRoot } from '../field/root/FieldRoot';
import { useFieldRootContext } from '../field/root/FieldRootContext';
import type { BaseUIComponentProps } from '../utils/types';
import { fieldValidityMapping } from '../field/utils/constants';

/**
 * Provides a shared state to a series of checkboxes.
 *
 * Documentation: [Base UI Checkbox Group](https://base-ui.com/react/components/checkbox-group)
 */
export const CheckboxGroup = React.forwardRef(function CheckboxGroup(
  props: CheckboxGroup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    render,
    className,
    value: externalValue,
    defaultValue,
    onValueChange,
    allValues,
    disabled: disabledProp = false,
    ...otherProps
  } = props;

  const { disabled: fieldDisabled, state: fieldState } = useFieldRootContext();

  const disabled = fieldDisabled || disabledProp;

  const { getRootProps, value, setValue, parent } = useCheckboxGroup({
    value: externalValue,
    allValues,
    defaultValue,
    onValueChange,
  });

  const state: CheckboxGroup.State = React.useMemo(
    () => ({
      ...fieldState,
      disabled,
    }),
    [fieldState, disabled],
  );

  const { renderElement } = useComponentRenderer({
    propGetter: getRootProps,
    render: render ?? 'div',
    className,
    state,
    ref: forwardedRef,
    extraProps: otherProps,
    customStyleHookMapping: fieldValidityMapping,
  });

  const contextValue: CheckboxGroupContext = React.useMemo(
    () => ({
      allValues,
      value,
      defaultValue,
      setValue,
      parent,
      disabled,
    }),
    [allValues, value, defaultValue, setValue, parent, disabled],
  );

  return (
    <CheckboxGroupContext.Provider value={contextValue}>
      {renderElement()}
    </CheckboxGroupContext.Provider>
  );
});

export namespace CheckboxGroup {
  export interface State extends FieldRoot.State {
    /**
     * Whether the component should ignore user interaction.
     */
    disabled: boolean;
  }

  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * Names of the checkboxes in the group that should be ticked.
     *
     * To render an uncontrolled checkbox group, use the `defaultValue` prop instead.
     */
    value?: string[];
    /**
     * Names of the checkboxes in the group that should be initially ticked.
     *
     * To render a controlled checkbox group, use the `value` prop instead.
     */
    defaultValue?: string[];
    /**
     * Event handler called when a checkbox in the group is ticked or unticked.
     * Provides the new value as an argument.
     */
    onValueChange?: (value: string[], event: Event) => void;
    /**
     * Names of all checkboxes in the group. Use this when creating a parent checkbox.
     */
    allValues?: string[];
    /**
     * Whether the component should ignore user interaction.
     * @default false
     */
    disabled?: boolean;
  }
}
