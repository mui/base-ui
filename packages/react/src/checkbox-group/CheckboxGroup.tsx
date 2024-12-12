'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../utils/useComponentRenderer';
import { useCheckboxGroup } from './useCheckboxGroup';
import { CheckboxGroupContext } from './CheckboxGroupContext';
import type { FieldRoot } from '../field/root/FieldRoot';
import { useFieldRootContext } from '../field/root/FieldRootContext';
import type { BaseUIComponentProps } from '../utils/types';

/**
 * Provides a shared state to a series of checkboxes.
 *
 * Documentation: [Base UI Checkbox Group](https://base-ui.com/react/components/checkbox-group)
 */
const CheckboxGroup = React.forwardRef(function CheckboxGroup(
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
  });

  const contextValue: CheckboxGroupContext = React.useMemo(
    () => ({
      allValues,
      value,
      defaultValue,
      setValue,
      parent,
    }),
    [allValues, value, defaultValue, setValue, parent],
  );

  return (
    <CheckboxGroupContext.Provider value={contextValue}>
      {renderElement()}
    </CheckboxGroupContext.Provider>
  );
});

namespace CheckboxGroup {
  export interface State extends FieldRoot.State {
    /**
     * Whether the component should ignore user interaction.
     */
    disabled: boolean;
  }
  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * The currently checked values of the checkbox group. Use when controlled.
     */
    value?: string[];
    /**
     * The default checked values of the checkbox group. Use when uncontrolled.
     */
    defaultValue?: string[];
    /**
     * A callback function that is called when the value of the checkbox group changes.
     * Use when controlled.
     */
    onValueChange?: (value: string[], event: Event) => void;
    /**
     * All values of the checkboxes in the group.
     */
    allValues?: string[];
    /**
     * Whether the component should ignore user interaction.
     * @default false
     */
    disabled?: boolean;
  }
}

CheckboxGroup.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * All values of the checkboxes in the group.
   */
  allValues: PropTypes.arrayOf(PropTypes.string),
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
   * The default checked values of the checkbox group. Use when uncontrolled.
   */
  defaultValue: PropTypes.arrayOf(PropTypes.string),
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled: PropTypes.bool,
  /**
   * A callback function that is called when the value of the checkbox group changes.
   * Use when controlled.
   */
  onValueChange: PropTypes.func,
  /**
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   *
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  /**
   * The currently checked values of the checkbox group. Use when controlled.
   */
  value: PropTypes.arrayOf(PropTypes.string),
} as any;

export { CheckboxGroup };
