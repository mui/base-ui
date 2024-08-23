'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useCheckboxGroupRoot } from './useCheckboxGroupRoot';
import { CheckboxGroupRootContext } from './CheckboxGroupRootContext';
import { useFieldRootContext } from '../../Field/Root/FieldRootContext';
import type { BaseUIComponentProps } from '../../utils/types';

/**
 * The foundation for building custom-styled checkbox groups.
 *
 * Demos:
 *
 * - [CheckboxGroup](https://mui.com/base-ui/react-checkbox-group/)
 *
 * API:
 *
 * - [CheckboxGroup API](https://mui.com/base-ui/react-checkbox/components-api/#checkbox-group-root)
 */
const CheckboxGroupRoot = React.forwardRef(function CheckboxGroupRoot(
  props: CheckboxGroupRoot.Props,
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

  const { disabled: fieldDisabled, ownerState: fieldOwnerState } = useFieldRootContext();

  const disabled = disabledProp || fieldDisabled;

  const { getRootProps, value, setValue, parent } = useCheckboxGroupRoot({
    value: externalValue,
    allValues,
    defaultValue,
    onValueChange,
  });

  const ownerState = React.useMemo(
    () => ({
      ...fieldOwnerState,
      disabled,
    }),
    [fieldOwnerState, disabled],
  );

  const { renderElement } = useComponentRenderer({
    propGetter: getRootProps,
    render: render ?? 'div',
    className,
    ownerState,
    ref: forwardedRef,
    extraProps: otherProps,
  });

  const contextValue: CheckboxGroupRootContext = React.useMemo(
    () => ({
      allValues,
      value,
      setValue,
      parent,
    }),
    [allValues, value, setValue, parent],
  );

  return (
    <CheckboxGroupRootContext.Provider value={contextValue}>
      {renderElement()}
    </CheckboxGroupRootContext.Provider>
  );
});

namespace CheckboxGroupRoot {
  export interface OwnerState {}
  export interface Props extends BaseUIComponentProps<'div', OwnerState> {
    value?: string[];
    defaultValue?: string[];
    onValueChange?: (value: string[], event: Event) => void;
    allValues?: string[];
    disabled?: boolean;
  }
}

CheckboxGroupRoot.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  allValues: PropTypes.arrayOf(PropTypes.string),
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * @ignore
   */
  defaultValue: PropTypes.arrayOf(PropTypes.string),
  /**
   * @ignore
   */
  disabled: PropTypes.bool,
  /**
   * @ignore
   */
  onValueChange: PropTypes.func,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  /**
   * @ignore
   */
  value: PropTypes.arrayOf(PropTypes.string),
} as any;

export { CheckboxGroupRoot };
