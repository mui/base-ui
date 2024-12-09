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
 *
 * Demos:
 *
 * - [Radio Group](https://base-ui.com/components/react-radio-group/)
 *
 * API:
 *
 * - [RadioGroup API](https://base-ui.com/components/react-radio-group/#api-reference-RadioGroup)
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
    disabled: boolean | undefined;
    readOnly: boolean | undefined;
  }

  export interface Props
    extends Omit<BaseUIComponentProps<'div', State>, 'value' | 'defaultValue'> {
    /**
     * Determines if the radio group is disabled.
     * @default false
     */
    disabled?: boolean;
    /**
     * Determines if the radio group is readonly.
     * @default false
     */
    readOnly?: boolean;
    /**
     * Determines if the radio group is required.
     * @default false
     */
    required?: boolean;
    /**
     * The name of the radio group submitted with the form data.
     */
    name?: string;
    /**
     * The value of the selected radio button. Use when controlled.
     */
    value?: unknown;
    /**
     * The default value of the selected radio button. Use when uncontrolled.
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
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * The default value of the selected radio button. Use when uncontrolled.
   */
  defaultValue: PropTypes.any,
  /**
   * Determines if the radio group is disabled.
   * @default false
   */
  disabled: PropTypes.bool,
  /**
   * The name of the radio group submitted with the form data.
   */
  name: PropTypes.string,
  /**
   * Callback fired when the value changes.
   */
  onValueChange: PropTypes.func,
  /**
   * Determines if the radio group is readonly.
   * @default false
   */
  readOnly: PropTypes.bool,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  /**
   * Determines if the radio group is required.
   * @default false
   */
  required: PropTypes.bool,
  /**
   * The value of the selected radio button. Use when controlled.
   */
  value: PropTypes.any,
} as any;

export { RadioGroup };
