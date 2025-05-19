'use client';
import * as React from 'react';
import { NumberFieldRootContext } from './NumberFieldRootContext';
import { useNumberFieldRoot } from './useNumberFieldRoot';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { BaseUIComponentProps } from '../../utils/types';
import type { FieldRoot } from '../../field/root/FieldRoot';
import { stateAttributesMapping } from '../utils/stateAttributesMapping';

/**
 * Groups all parts of the number field and manages its state.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Number Field](https://base-ui.com/react/components/number-field)
 */
export const NumberFieldRoot = React.forwardRef(function NumberFieldRoot(
  props: NumberFieldRoot.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    id,
    min,
    max,
    smallStep,
    step,
    largeStep,
    required = false,
    disabled: disabledProp = false,
    readOnly = false,
    name,
    defaultValue,
    value,
    onValueChange,
    allowWheelScrub,
    snapOnStep,
    format,
    locale,
    render,
    className,
    ...otherProps
  } = props;

  const numberField = useNumberFieldRoot(props);

  const { state: fieldState, disabled: fieldDisabled } = useFieldRootContext();
  const disabled = fieldDisabled || disabledProp;

  const state: NumberFieldRoot.State = React.useMemo(
    () => ({
      ...fieldState,
      disabled,
      readOnly,
      required,
      value: numberField.value,
      inputValue: numberField.inputValue,
      scrubbing: numberField.isScrubbing,
    }),
    [
      fieldState,
      disabled,
      readOnly,
      required,
      numberField.value,
      numberField.inputValue,
      numberField.isScrubbing,
    ],
  );

  const contextValue = React.useMemo(
    () => ({
      ...numberField,
      state,
    }),
    [numberField, state],
  );

  const { renderElement } = useComponentRenderer({
    ref: forwardedRef,
    render: render ?? 'div',
    state,
    className,
    extraProps: otherProps,
    stateAttributesMapping: stateAttributesMapping,
  });

  return (
    <NumberFieldRootContext.Provider value={contextValue}>
      {renderElement()}
    </NumberFieldRootContext.Provider>
  );
});

export namespace NumberFieldRoot {
  export interface Props
    extends useNumberFieldRoot.Parameters,
      Omit<BaseUIComponentProps<'div', State>, 'onChange'> {}

  export interface State extends FieldRoot.State {
    /**
     * The raw numeric value of the field.
     */
    value: number | null;
    /**
     * The formatted string value presented in the input element.
     */
    inputValue: string;
    /**
     * Whether the user must enter a value before submitting a form.
     */
    required: boolean;
    /**
     * Whether the component should ignore user interaction.
     */
    disabled: boolean;
    /**
     * Whether the user should be unable to change the field value.
     */
    readOnly: boolean;
    /**
     * Whether the user is currently scrubbing the field.
     */
    scrubbing: boolean;
  }
}
