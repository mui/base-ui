'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { CompositeItem } from '../../Composite/Item/CompositeItem';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { RadioGroupItemOwnerState, RadioGroupItemProps } from './RadioGroupItem.types';
import { useRadioGroupItem } from './useRadioGroupItem';
import { useRadioGroupRootContext } from '../Root/RadioGroupRootContext';
import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { RadioGroupItemContext, type RadioGroupItemContextValue } from './RadioGroupItemContext';

const customStyleHookMapping: CustomStyleHookMapping<RadioGroupItemOwnerState> = {
  checked(value) {
    return {
      'data-radio-group': value ? 'checked' : 'unchecked',
    };
  },
};

const RadioGroupItem = React.forwardRef(function RadioGroupItem(
  props: RadioGroupItemProps,
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
  } = useRadioGroupRootContext();

  const disabled = disabledRoot ?? disabledProp;
  const readOnly = readOnlyRoot ?? readOnlyProp;
  const required = requiredRoot ?? requiredProp;

  const { getItemProps, getInputProps, checked } = useRadioGroupItem({
    ...props,
    disabled,
    readOnly,
  });

  const ownerState: RadioGroupItemOwnerState = React.useMemo(
    () => ({
      required,
      disabled,
      readOnly,
      checked,
    }),
    [disabled, readOnly, checked, required],
  );

  const contextValue: RadioGroupItemContextValue = React.useMemo(
    () => ({
      checked,
      disabled,
      readOnly,
      required,
    }),
    [checked, disabled, readOnly, required],
  );

  const { renderElement } = useComponentRenderer({
    propGetter: getItemProps,
    render: render ?? 'button',
    ref: forwardedRef,
    className,
    ownerState,
    extraProps: otherProps,
    customStyleHookMapping,
  });

  return (
    <RadioGroupItemContext.Provider value={contextValue}>
      <CompositeItem render={renderElement()} />
      <input {...getInputProps()} />
    </RadioGroupItemContext.Provider>
  );
});

RadioGroupItem.propTypes /* remove-proptypes */ = {
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
   * Determines if the item is disabled.
   * @default false
   */
  disabled: PropTypes.bool,
  /**
   * Determines if the item is readonly.
   * @default false
   */
  readOnly: PropTypes.bool,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  /**
   * Determines if the item is required.
   * @default false
   */
  required: PropTypes.bool,
  /**
   * The unique identifying value of the radio button in the group.
   */
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
} as any;

export { RadioGroupItem };
