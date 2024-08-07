'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { CompositeRoot } from '../../Composite/Root/CompositeRoot';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useEventCallback } from '../../utils/useEventCallback';
import type { RadioGroupRootOwnerState, RadioGroupRootProps } from './RadioGroupRoot.types';
import { useRadioGroupRoot } from './useRadioGroupRoot';
import { type RadioGroupRootContextValue, RadioGroupRootContext } from './RadioGroupRootContext';

const RadioGroupRoot = React.forwardRef(function RadioGroupRoot(
  props: RadioGroupRootProps,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    render,
    className,
    disabled,
    readOnly,
    required,
    onValueChange: onValueChangeProp,
    name,
    ...otherProps
  } = props;

  const { getRootProps, checkedItem, setCheckedItem, touched, setTouched } =
    useRadioGroupRoot(props);

  const onValueChange = useEventCallback(onValueChangeProp ?? (() => {}));

  const ownerState: RadioGroupRootOwnerState = React.useMemo(
    () => ({
      disabled: disabled ?? false,
      required: required ?? false,
      readOnly: readOnly ?? false,
    }),
    [disabled, readOnly, required],
  );

  const contextValue: RadioGroupRootContextValue = React.useMemo(
    () => ({
      checkedItem,
      setCheckedItem,
      onValueChange,
      disabled,
      readOnly,
      required,
      touched,
      setTouched,
    }),
    [checkedItem, setCheckedItem, onValueChange, disabled, readOnly, required, touched, setTouched],
  );

  const { renderElement } = useComponentRenderer({
    propGetter: getRootProps,
    render: render ?? 'div',
    ref: forwardedRef,
    className,
    ownerState,
    extraProps: otherProps,
  });

  return (
    <RadioGroupRootContext.Provider value={contextValue}>
      <CompositeRoot render={renderElement()} />
      {props.name && (
        <input type="hidden" name={props.name} value={checkedItem ?? ''} required={required} />
      )}
    </RadioGroupRootContext.Provider>
  );
});

RadioGroupRoot.propTypes /* remove-proptypes */ = {
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

export { RadioGroupRoot };
