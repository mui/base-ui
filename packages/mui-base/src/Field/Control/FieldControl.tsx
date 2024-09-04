'use client';

import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { FieldControlElement, FieldControlProps } from './FieldControl.types';
import { useFieldControl } from './useFieldControl';
import { useFieldRootContext } from '../Root/FieldRootContext';
import { STYLE_HOOK_MAPPING } from '../utils/constants';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';

/**
 * The field's control element. This is not necessary to use when using a native Base UI input
 * component (Checkbox, Switch, NumberField, Slider).
 *
 * Demos:
 *
 * - [Field](https://mui.com/base-ui/react-field/)
 *
 * API:
 *
 * - [FieldControl API](https://mui.com/base-ui/react-field/components-api/#field-control)
 */
const FieldControl = React.forwardRef(function FieldControl(
  props: FieldControlProps,
  forwardedRef: React.ForwardedRef<FieldControlElement>,
) {
  const {
    render,
    className,
    id,
    disabled = false,
    name,
    value,
    defaultValue,
    ...otherProps
  } = props;

  const { setDisabled, ownerState } = useFieldRootContext(false);

  useEnhancedEffect(() => {
    setDisabled(disabled);
  }, [disabled, setDisabled]);

  const { getControlProps } = useFieldControl({ id, name, value: value ?? defaultValue ?? '' });

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
