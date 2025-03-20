'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useRenderElement';
import { useFieldControl } from './useFieldControl';
import { FieldRoot } from '../root/FieldRoot';
import { useFieldRootContext } from '../root/FieldRootContext';
import { fieldValidityMapping } from '../utils/constants';
import { BaseUIComponentProps } from '../../utils/types';

/**
 * The form control to label and validate.
 * Renders an `<input>` element.
 *
 * You can omit this part and use any Base UI input component instead. For example,
 * [Input](https://base-ui.com/react/components/input), [Checkbox](https://base-ui.com/react/components/checkbox),
 * or [Select](https://base-ui.com/react/components/select), among others, will work with Field out of the box.
 *
 * Documentation: [Base UI Field](https://base-ui.com/react/components/field)
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
    customStyleHookMapping: fieldValidityMapping,
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
   * CSS class applied to the element, or a function that
   * returns a class based on the component’s state.
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
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   *
   * Accepts a `ReactElement` or a function that returns the element to render.
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
