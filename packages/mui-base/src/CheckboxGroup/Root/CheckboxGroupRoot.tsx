'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useCheckboxGroupRoot } from './useCheckboxGroupRoot';
import { CheckboxGroupRootContext } from './CheckboxGroupRootContext';
import type { FieldRoot } from '../../Field/Root/FieldRoot';
import { useFieldRootContext } from '../../Field/Root/FieldRootContext';
import type { BaseUIComponentProps } from '../../utils/types';

/**
 * The foundation for building custom-styled checkbox groups.
 *
 * Demos:
 *
 * - [Checkbox Group](https://base-ui.netlify.app/components/react-checkbox-group/)
 *
 * API:
 *
 * - [CheckboxGroupRoot API](https://base-ui.netlify.app/components/react-checkbox-group/#api-reference-CheckboxGroupRoot)
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
    preserveChildStates = false,
    ...otherProps
  } = props;

  const { disabled: fieldDisabled, ownerState: fieldOwnerState } = useFieldRootContext();

  const disabled = fieldDisabled || disabledProp;

  const { getRootProps, value, setValue, parent } = useCheckboxGroupRoot({
    value: externalValue,
    allValues,
    defaultValue,
    onValueChange,
    preserveChildStates,
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
  export interface OwnerState extends FieldRoot.OwnerState {
    disabled: boolean;
  }
  export interface Props extends BaseUIComponentProps<'div', OwnerState> {
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
     * Whether the checkbox group is disabled.
     * @default false
     */
    disabled?: boolean;
    /**
     * Whether the parent checkbox should preserve its child states when checked/unchecked, leading
     * to a tri-state checkbox group.
     * @default false
     */
    preserveChildStates?: boolean;
  }
}

CheckboxGroupRoot.propTypes /* remove-proptypes */ = {
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
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * The default checked values of the checkbox group. Use when uncontrolled.
   */
  defaultValue: PropTypes.arrayOf(PropTypes.string),
  /**
   * Whether the checkbox group is disabled.
   * @default false
   */
  disabled: PropTypes.bool,
  /**
   * A callback function that is called when the value of the checkbox group changes.
   * Use when controlled.
   */
  onValueChange: PropTypes.func,
  /**
   * Whether the parent checkbox should preserve its child states when checked/unchecked, leading
   * to a tri-state checkbox group.
   * @default false
   */
  preserveChildStates: PropTypes.bool,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  /**
   * The currently checked values of the checkbox group. Use when controlled.
   */
  value: PropTypes.arrayOf(PropTypes.string),
} as any;

export { CheckboxGroupRoot };
