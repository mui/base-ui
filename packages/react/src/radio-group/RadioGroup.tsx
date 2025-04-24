'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../utils/types';
import { SHIFT } from '../composite/composite';
import { CompositeRoot } from '../composite/root/CompositeRoot';
import { useComponentRenderer } from '../utils/useComponentRenderer';
import { useEventCallback } from '../utils/useEventCallback';
import { useDirection } from '../direction-provider/DirectionContext';
import { useRadioGroup } from './useRadioGroup';
import { RadioGroupContext } from './RadioGroupContext';
import { useFieldRootContext } from '../field/root/FieldRootContext';
import { fieldValidityMapping } from '../field/utils/constants';
import type { FieldRoot } from '../field/root/FieldRoot';

const MODIFIER_KEYS = [SHIFT];

/**
 * Provides a shared state to a series of radio buttons.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Radio Group](https://base-ui.com/react/components/radio)
 */
const RadioGroup = React.forwardRef(function RadioGroup(
  props: RadioGroup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    render,
    className,
    disabled: disabledProp,
    readOnly,
    required,
    onValueChange: onValueChangeProp,
    name,
    value,
    defaultValue,
    ...otherProps
  } = props;

  const direction = useDirection();

  const radioGroup = useRadioGroup(props);

  const { state: fieldState, disabled: fieldDisabled } = useFieldRootContext();

  const disabled = fieldDisabled || disabledProp;

  const onValueChange = useEventCallback(onValueChangeProp ?? (() => {}));

  const state: RadioGroup.State = React.useMemo(
    () => ({
      ...fieldState,
      disabled: disabled ?? false,
      required: required ?? false,
      readOnly: readOnly ?? false,
    }),
    [fieldState, disabled, readOnly, required],
  );

  const contextValue: RadioGroupContext = React.useMemo(
    () => ({
      ...fieldState,
      ...radioGroup,
      onValueChange,
      disabled,
      readOnly,
      required,
    }),
    [fieldState, disabled, onValueChange, radioGroup, readOnly, required],
  );

  const { renderElement } = useComponentRenderer({
    propGetter: radioGroup.getRootProps,
    render: render ?? 'div',
    ref: forwardedRef,
    className,
    state,
    extraProps: otherProps,
    customStyleHookMapping: fieldValidityMapping,
  });

  return (
    <RadioGroupContext.Provider value={contextValue}>
      <CompositeRoot
        direction={direction}
        enableHomeAndEndKeys={false}
        modifierKeys={MODIFIER_KEYS}
        render={renderElement()}
      />
      <input {...radioGroup.getInputProps()} />
    </RadioGroupContext.Provider>
  );
});

namespace RadioGroup {
  export interface State extends FieldRoot.State {
    /**
     * Whether the user should be unable to select a different radio button in the group.
     */
    readOnly: boolean | undefined;
  }

  export interface Props extends Omit<BaseUIComponentProps<'div', State>, 'value'> {
    /**
     * Whether the component should ignore user interaction.
     * @default false
     */
    disabled?: boolean;
    /**
     * Whether the user should be unable to select a different radio button in the group.
     * @default false
     */
    readOnly?: boolean;
    /**
     * Whether the user must choose a value before submitting a form.
     * @default false
     */
    required?: boolean;
    /**
     * Identifies the field when a form is submitted.
     */
    name?: string;
    /**
     * The controlled value of the radio item that should be currently selected.
     *
     * To render an uncontrolled radio group, use the `defaultValue` prop instead.
     */
    value?: unknown;
    /**
     * The uncontrolled value of the radio button that should be initially selected.
     *
     * To render a controlled radio group, use the `value` prop instead.
     */
    defaultValue?: unknown;
    /**
     * Callback fired when the value changes.
     */
    onValueChange?: (value: unknown, event: Event) => void;
  }
}

export { RadioGroup };
