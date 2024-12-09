'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useRadioGroupContext } from '../../radio-group/RadioGroupContext';
import { useRadioRoot } from './useRadioRoot';
import { RadioRootContext } from './RadioRootContext';
import { CompositeItem } from '../../composite/item/CompositeItem';
import { NOOP } from '../../utils/noop';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { customStyleHookMapping } from '../utils/customStyleHookMapping';

/**
 */
const RadioRoot = React.forwardRef(function RadioRoot(
  props: RadioRoot.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const {
    render,
    className,
    disabled: disabledProp = false,
    readOnly: readOnlyProp = false,
    required: requiredProp = false,
    ...otherProps
  } = props;

  const {
    disabled: disabledRoot,
    readOnly: readOnlyRoot,
    required: requiredRoot,
    setCheckedValue,
  } = useRadioGroupContext();

  const { state: fieldState, disabled: fieldDisabled } = useFieldRootContext();

  const disabled = fieldDisabled || disabledRoot || disabledProp;
  const readOnly = readOnlyRoot || readOnlyProp;
  const required = requiredRoot || requiredProp;

  const { getRootProps, getInputProps, checked } = useRadioRoot({
    ...props,
    disabled,
    readOnly,
  });

  const state: RadioRoot.State = React.useMemo(
    () => ({
      ...fieldState,
      required,
      disabled,
      readOnly,
      checked,
    }),
    [fieldState, disabled, readOnly, checked, required],
  );

  const contextValue: RadioRootContext = React.useMemo(() => state, [state]);

  const { renderElement } = useComponentRenderer({
    propGetter: getRootProps,
    render: render ?? 'button',
    ref: forwardedRef,
    className,
    state,
    extraProps: otherProps,
    customStyleHookMapping,
  });

  return (
    <RadioRootContext.Provider value={contextValue}>
      {setCheckedValue === NOOP ? renderElement() : <CompositeItem render={renderElement()} />}
      <input {...getInputProps()} />
    </RadioRootContext.Provider>
  );
});

namespace RadioRoot {
  export interface Props extends Omit<BaseUIComponentProps<'button', State>, 'value'> {
    /**
     * The unique identifying value of the radio in a group.
     */
    value: unknown;
    /**
     * Determines if the radio is disabled.
     * @default false
     */
    disabled?: boolean;
    /**
     * Determines if the radio is required.
     * @default false
     */
    required?: boolean;
    /**
     * Determines if the radio is readonly.
     * @default false
     */
    readOnly?: boolean;
  }

  export interface State {
    checked: boolean;
    disabled: boolean;
    readOnly: boolean;
    required: boolean;
  }
}

RadioRoot.propTypes /* remove-proptypes */ = {
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
   * Determines if the radio is disabled.
   * @default false
   */
  disabled: PropTypes.bool,
  /**
   * Determines if the radio is readonly.
   * @default false
   */
  readOnly: PropTypes.bool,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  /**
   * Determines if the radio is required.
   * @default false
   */
  required: PropTypes.bool,
  /**
   * The unique identifying value of the radio in a group.
   */
  value: PropTypes.any.isRequired,
} as any;

export { RadioRoot };
