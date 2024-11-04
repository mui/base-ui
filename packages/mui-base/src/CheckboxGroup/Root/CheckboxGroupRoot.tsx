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
  export type Props = BaseUIComponentProps<'div', OwnerState> & {
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
  };
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
  children: PropTypes.oneOfType([
    PropTypes.element,
    PropTypes.func,
    PropTypes.number,
    PropTypes.shape({
      '__@toStringTag@620': PropTypes.oneOf(['BigInt']).isRequired,
      toLocaleString: PropTypes.func.isRequired,
      toString: PropTypes.func.isRequired,
      valueOf: PropTypes.func.isRequired,
    }),
    PropTypes.shape({
      '__@iterator@96': PropTypes.func.isRequired,
    }),
    PropTypes.shape({
      children: PropTypes.node,
      key: PropTypes.string,
      props: PropTypes.any.isRequired,
      type: PropTypes.oneOfType([PropTypes.func, PropTypes.string]).isRequired,
    }),
    PropTypes.shape({
      '__@toStringTag@620': PropTypes.string.isRequired,
      catch: PropTypes.func.isRequired,
      finally: PropTypes.func.isRequired,
      then: PropTypes.func.isRequired,
    }),
    PropTypes.string,
    PropTypes.bool,
  ]),
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * The default checked values of the checkbox group. Use when uncontrolled.
   */
  defaultValue: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.shape({
      '__@iterator@96': PropTypes.func.isRequired,
      '__@unscopables@1681': PropTypes.shape({
        '__@iterator@96': PropTypes.bool,
        '__@unscopables@1681': PropTypes.bool,
        at: PropTypes.bool,
        concat: PropTypes.bool,
        copyWithin: PropTypes.bool,
        entries: PropTypes.bool,
        every: PropTypes.bool,
        fill: PropTypes.bool,
        filter: PropTypes.bool,
        find: PropTypes.bool,
        findIndex: PropTypes.bool,
        flat: PropTypes.bool,
        flatMap: PropTypes.bool,
        forEach: PropTypes.bool,
        includes: PropTypes.bool,
        indexOf: PropTypes.bool,
        join: PropTypes.bool,
        keys: PropTypes.bool,
        lastIndexOf: PropTypes.bool,
        length: PropTypes.bool,
        map: PropTypes.bool,
        pop: PropTypes.bool,
        push: PropTypes.bool,
        reduce: PropTypes.bool,
        reduceRight: PropTypes.bool,
        reverse: PropTypes.bool,
        shift: PropTypes.bool,
        slice: PropTypes.bool,
        some: PropTypes.bool,
        sort: PropTypes.bool,
        splice: PropTypes.bool,
        toLocaleString: PropTypes.bool,
        toString: PropTypes.bool,
        unshift: PropTypes.bool,
        values: PropTypes.bool,
      }).isRequired,
      at: PropTypes.func.isRequired,
      concat: PropTypes.func.isRequired,
      copyWithin: PropTypes.func.isRequired,
      entries: PropTypes.func.isRequired,
      every: PropTypes.func.isRequired,
      fill: PropTypes.func.isRequired,
      filter: PropTypes.func.isRequired,
      find: PropTypes.func.isRequired,
      findIndex: PropTypes.func.isRequired,
      flat: PropTypes.func.isRequired,
      flatMap: PropTypes.func.isRequired,
      forEach: PropTypes.func.isRequired,
      includes: PropTypes.func.isRequired,
      indexOf: PropTypes.func.isRequired,
      join: PropTypes.func.isRequired,
      keys: PropTypes.func.isRequired,
      lastIndexOf: PropTypes.func.isRequired,
      length: PropTypes.number.isRequired,
      map: PropTypes.func.isRequired,
      pop: PropTypes.func.isRequired,
      push: PropTypes.func.isRequired,
      reduce: PropTypes.func.isRequired,
      reduceRight: PropTypes.func.isRequired,
      reverse: PropTypes.func.isRequired,
      shift: PropTypes.func.isRequired,
      slice: PropTypes.func.isRequired,
      some: PropTypes.func.isRequired,
      sort: PropTypes.func.isRequired,
      splice: PropTypes.func.isRequired,
      toExponential: PropTypes.func.isRequired,
      toFixed: PropTypes.func.isRequired,
      toLocaleString: PropTypes.func.isRequired,
      toPrecision: PropTypes.func.isRequired,
      toString: PropTypes.func.isRequired,
      unshift: PropTypes.func.isRequired,
      valueOf: PropTypes.func.isRequired,
      values: PropTypes.func.isRequired,
    }),
    PropTypes.shape({
      '__@iterator@96': PropTypes.func.isRequired,
      '__@unscopables@1681': PropTypes.shape({
        '__@iterator@96': PropTypes.bool,
        '__@unscopables@1681': PropTypes.bool,
        at: PropTypes.bool,
        concat: PropTypes.bool,
        copyWithin: PropTypes.bool,
        entries: PropTypes.bool,
        every: PropTypes.bool,
        fill: PropTypes.bool,
        filter: PropTypes.bool,
        find: PropTypes.bool,
        findIndex: PropTypes.bool,
        flat: PropTypes.bool,
        flatMap: PropTypes.bool,
        forEach: PropTypes.bool,
        includes: PropTypes.bool,
        indexOf: PropTypes.bool,
        join: PropTypes.bool,
        keys: PropTypes.bool,
        lastIndexOf: PropTypes.bool,
        length: PropTypes.bool,
        map: PropTypes.bool,
        pop: PropTypes.bool,
        push: PropTypes.bool,
        reduce: PropTypes.bool,
        reduceRight: PropTypes.bool,
        reverse: PropTypes.bool,
        shift: PropTypes.bool,
        slice: PropTypes.bool,
        some: PropTypes.bool,
        sort: PropTypes.bool,
        splice: PropTypes.bool,
        toLocaleString: PropTypes.bool,
        toString: PropTypes.bool,
        unshift: PropTypes.bool,
        values: PropTypes.bool,
      }).isRequired,
      at: PropTypes.func.isRequired,
      concat: PropTypes.func.isRequired,
      copyWithin: PropTypes.func.isRequired,
      entries: PropTypes.func.isRequired,
      every: PropTypes.func.isRequired,
      fill: PropTypes.func.isRequired,
      filter: PropTypes.func.isRequired,
      find: PropTypes.func.isRequired,
      findIndex: PropTypes.func.isRequired,
      flat: PropTypes.func.isRequired,
      flatMap: PropTypes.func.isRequired,
      forEach: PropTypes.func.isRequired,
      includes: PropTypes.func.isRequired,
      indexOf: PropTypes.func.isRequired,
      join: PropTypes.func.isRequired,
      keys: PropTypes.func.isRequired,
      lastIndexOf: PropTypes.func.isRequired,
      length: PropTypes.number.isRequired,
      map: PropTypes.func.isRequired,
      pop: PropTypes.func.isRequired,
      push: PropTypes.func.isRequired,
      reduce: PropTypes.func.isRequired,
      reduceRight: PropTypes.func.isRequired,
      reverse: PropTypes.func.isRequired,
      shift: PropTypes.func.isRequired,
      slice: PropTypes.func.isRequired,
      some: PropTypes.func.isRequired,
      sort: PropTypes.func.isRequired,
      splice: PropTypes.func.isRequired,
      toLocaleString: PropTypes.func.isRequired,
      toString: PropTypes.func.isRequired,
      unshift: PropTypes.func.isRequired,
      values: PropTypes.func.isRequired,
    }),
  ]),
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
