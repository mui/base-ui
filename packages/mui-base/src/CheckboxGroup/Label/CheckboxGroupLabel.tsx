'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { CheckboxGroupLabelProps } from './CheckboxGroupLabel.types';
import { useCheckboxGroupRootContext } from '../Root/CheckboxGroupRootContext';
import { useCheckboxGroupLabel } from './useCheckboxGroupLabel';

/**
 * The label of a checkbox group.
 *
 * Demos:
 *
 * - [CheckboxGroupLabel](https://mui.com/base-ui/react-checkbox-group/)
 *
 * API:
 *
 * - [CheckboxGroupLabel API](https://mui.com/base-ui/react-checkbox/components-api/#checkbox-group-label)
 */
const CheckboxGroupLabel = React.forwardRef(function CheckboxGroupLabel(
  props: CheckboxGroupLabelProps,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { render, className, ...otherProps } = props;

  const { groupLabelId, setGroupLabelId } = useCheckboxGroupRootContext();
  const { getLabelProps } = useCheckboxGroupLabel({
    id: groupLabelId,
    setId: setGroupLabelId,
  });

  const { renderElement } = useComponentRenderer({
    propGetter: getLabelProps,
    render: render ?? 'span',
    ownerState: {},
    className,
    ref: forwardedRef,
    extraProps: otherProps,
  });

  return renderElement();
});

CheckboxGroupLabel.propTypes /* remove-proptypes */ = {
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
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { CheckboxGroupLabel };
