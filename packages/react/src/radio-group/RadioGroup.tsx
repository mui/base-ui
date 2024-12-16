'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { BaseUIComponentProps } from '../utils/types';
import { CompositeRoot } from '../composite/root/CompositeRoot';
import { useComponentRenderer } from '../utils/useComponentRenderer';
import { useEventCallback } from '../utils/useEventCallback';
import { useDirection } from '../direction-provider/DirectionContext';
import { useRadioGroup } from './useRadioGroup';
import { RadioGroupContext } from './RadioGroupContext';
import { useFieldRootContext } from '../field/root/FieldRootContext';

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
    ...otherProps
  } = props;

  const direction = useDirection();

  const { getRootProps, getInputProps, checkedValue, setCheckedValue, touched, setTouched } =
    useRadioGroup(props);

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
      checkedValue,
      setCheckedValue,
      onValueChange,
      disabled,
      readOnly,
      required,
      touched,
      setTouched,
    }),
    [
      checkedValue,
      setCheckedValue,
      onValueChange,
      disabled,
      readOnly,
      required,
      touched,
      setTouched,
    ],
  );

  const { renderElement } = useComponentRenderer({
    propGetter: getRootProps,
    render: render ?? 'div',
    ref: forwardedRef,
    className,
    state,
    extraProps: otherProps,
  });

  return (
    <RadioGroupContext.Provider value={contextValue}>
      <CompositeRoot direction={direction} enableHomeAndEndKeys={false} render={renderElement()} />
      <input {...getInputProps()} />
    </RadioGroupContext.Provider>
  );
});

namespace RadioGroup {
  export interface State {
    /**
     * Whether the component should ignore user interaction.
     */
    disabled: boolean | undefined;
    /**
     * Whether the user should be unable to select a different radio button in the group.
     */
    readOnly: boolean | undefined;
  }

  export interface Props
    extends Omit<BaseUIComponentProps<'div', State>, 'value' | 'defaultValue'> {
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

RadioGroup.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * CSS class applied to the element, or a function that
   * returns a class based on the component’s state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * The uncontrolled value of the radio button that should be initially selected.
   *
   * To render a controlled radio group, use the `value` prop instead.
   */
  defaultValue: PropTypes.any,
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled: PropTypes.bool,
  /**
   * Identifies the field when a form is submitted.
   */
  name: PropTypes.string,
  /**
   * Callback fired when the value changes.
   */
  onValueChange: PropTypes.func,
  /**
   * Whether the user should be unable to select a different radio button in the group.
   * @default false
   */
  readOnly: PropTypes.bool,
  /**
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   *
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  /**
   * Whether the user must choose a value before submitting a form.
   * @default false
   */
  required: PropTypes.bool,
  /**
   * The controlled value of the radio item that should be currently selected.
   *
   * To render an uncontrolled radio group, use the `defaultValue` prop instead.
   */
  value: PropTypes.any,
} as any;

export { RadioGroup };
