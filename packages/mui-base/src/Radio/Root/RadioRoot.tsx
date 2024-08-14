'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { BaseUIComponentProps } from '../../utils/types';
import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useRadioGroupRootContext } from '../../RadioGroup/Root/RadioGroupRootContext';
import { useRadioRoot } from './useRadioRoot';
import { RadioRootContext } from './RadioRootContext';
import { CompositeItem } from '../../Composite/Item/CompositeItem';
import { NOOP } from '../../utils/noop';

const customStyleHookMapping: CustomStyleHookMapping<RadioRoot.OwnerState> = {
  checked(value) {
    return {
      'data-radio': value ? 'checked' : 'unchecked',
    };
  },
};

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
    setCheckedItem,
  } = useRadioGroupRootContext();

  const disabled = disabledRoot || disabledProp;
  const readOnly = readOnlyRoot || readOnlyProp;
  const required = requiredRoot || requiredProp;

  const { getRootProps, getInputProps, checked } = useRadioRoot({
    ...props,
    disabled,
    readOnly,
  });

  const ownerState: RadioRoot.OwnerState = React.useMemo(
    () => ({
      required,
      disabled,
      readOnly,
      checked,
    }),
    [disabled, readOnly, checked, required],
  );

  const contextValue: RadioRootContext.Value = React.useMemo(() => ownerState, [ownerState]);

  const { renderElement } = useComponentRenderer({
    propGetter: getRootProps,
    render: render ?? 'button',
    ref: forwardedRef,
    className,
    ownerState,
    extraProps: otherProps,
    customStyleHookMapping,
  });

  return (
    <RadioRootContext.Provider value={contextValue}>
      {setCheckedItem === NOOP ? renderElement() : <CompositeItem render={renderElement()} />}
      <input {...getInputProps()} />
    </RadioRootContext.Provider>
  );
});

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
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
} as any;

export { RadioRoot };

namespace RadioRoot {
  export interface Props extends BaseUIComponentProps<'button', OwnerState> {
    /**
     * The unique identifying value of the radio in a group.
     */
    value: string | number;
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

  export interface OwnerState {
    checked: boolean;
    disabled: boolean;
    readOnly: boolean;
    required: boolean;
  }
}
