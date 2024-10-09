'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useFieldControl } from './useFieldControl';
import { FieldRoot } from '../Root/FieldRoot';
import { useFieldRootContext } from '../Root/FieldRootContext';
import { STYLE_HOOK_MAPPING } from '../utils/constants';
import { BaseUIComponentProps } from '../../utils/types';

export type FieldControlElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

/**
 * The field's control element. This is not necessary to use when using a native Base UI input
 * component (Checkbox, Switch, NumberField, Slider, Radio Group etc).
 *
 * Demos:
 *
 * - [Field](https://base-ui.netlify.app/components/react-field/)
 *
 * API:
 *
 * - [FieldControl API](https://base-ui.netlify.app/components/react-field/#api-reference-FieldControl)
 */
const FieldControl = React.forwardRef(function FieldControl(
  props: FieldControl.Props,
  forwardedRef: React.ForwardedRef<FieldControlElement>,
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

  const {
    ownerState: fieldOwnerState,
    name: fieldName,
    disabled: fieldDisabled,
  } = useFieldRootContext(false);

  const disabled = fieldDisabled || disabledProp;
  const name = fieldName ?? nameProp;

  const ownerState: FieldControl.OwnerState = React.useMemo(
    () => ({ ...fieldOwnerState, disabled }),
    [fieldOwnerState, disabled],
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
    ownerState,
    extraProps: otherProps,
    customStyleHookMapping: STYLE_HOOK_MAPPING,
  });

  return renderElement();
});

namespace FieldControl {
  export type OwnerState = FieldRoot.OwnerState;

  export interface Props extends BaseUIComponentProps<'input', OwnerState> {
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
