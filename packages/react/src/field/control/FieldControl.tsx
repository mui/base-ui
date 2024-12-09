'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useFieldControl } from './useFieldControl';
import { FieldRoot } from '../root/FieldRoot';
import { useFieldRootContext } from '../root/FieldRootContext';
import { STYLE_HOOK_MAPPING } from '../utils/constants';
import { BaseUIComponentProps } from '../../utils/types';

/**
 * The field's control element. This is not necessary to use when using a native Base UI input
 * component (Checkbox, Switch, NumberField, Slider, Radio Group etc).
 */
const FieldControl = React.forwardRef(function FieldControl(
  props: FieldControl.Props,
  forwardedRef: React.ForwardedRef<HTMLInputElement>,
) {
  const {
    render,
    className,
    id,
    name: nameProp,
    value,
    disabled: disabledProp = false,
    onValueChange,
    defaultValue,
    ...otherProps
  } = props;

  const { state: fieldState, name: fieldName, disabled: fieldDisabled } = useFieldRootContext();

  const disabled = fieldDisabled || disabledProp;
  const name = fieldName ?? nameProp;

  const state: FieldControl.State = React.useMemo(
    () => ({ ...fieldState, disabled }),
    [fieldState, disabled],
  );

  const { getControlProps } = useFieldControl({
    id,
    name,
    disabled,
    value,
    defaultValue,
    onValueChange,
  });

  const { renderElement } = useComponentRenderer({
    propGetter: getControlProps,
    render: render ?? 'input',
    ref: forwardedRef,
    className,
    state,
    extraProps: otherProps,
    customStyleHookMapping: STYLE_HOOK_MAPPING,
  });

  return renderElement();
});

namespace FieldControl {
  export type State = FieldRoot.State;

  export interface Props extends BaseUIComponentProps<'input', State> {
    /**
     * Callback fired when the `value` changes. Use when controlled.
     */
    onValueChange?: (value: string | number | readonly string[] | undefined, event: Event) => void;
  }
}

FieldControl.propTypes /* remove-proptypes */ = {
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
   * @ignore
   */
  defaultValue: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.string),
    PropTypes.number,
    PropTypes.string,
  ]),
  /**
   * @ignore
   */
  disabled: PropTypes.bool,
  /**
   * @ignore
   */
  id: PropTypes.string,
  /**
   * @ignore
   */
  name: PropTypes.string,
  /**
   * Callback fired when the `value` changes. Use when controlled.
   */
  onValueChange: PropTypes.func,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  /**
   * @ignore
   */
  value: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.string),
    PropTypes.number,
    PropTypes.string,
  ]),
} as any;

export { FieldControl };
