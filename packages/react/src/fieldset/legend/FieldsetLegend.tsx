'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useFieldsetLegend } from './useFieldsetLegend';
import { useFieldsetRootContext } from '../root/FieldsetRootContext';
import type { BaseUIComponentProps } from '../../utils/types';

/**
 * Renders an element that labels the fieldset.
 */
const FieldsetLegend = React.forwardRef(function FieldsetLegend(
  props: FieldsetLegend.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, id, ...otherProps } = props;

  const { getLegendProps } = useFieldsetLegend({ id });

  const { disabled } = useFieldsetRootContext();

  const state: FieldsetLegend.State = React.useMemo(
    () => ({
      disabled: disabled ?? false,
    }),
    [disabled],
  );

  const { renderElement } = useComponentRenderer({
    propGetter: getLegendProps,
    ref: forwardedRef,
    render: render ?? 'div',
    className,
    state,
    extraProps: otherProps,
  });

  return renderElement();
});

namespace FieldsetLegend {
  export interface State {
    disabled: boolean;
  }

  export interface Props extends BaseUIComponentProps<'div', State> {}
}

FieldsetLegend.propTypes /* remove-proptypes */ = {
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
  id: PropTypes.string,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { FieldsetLegend };
