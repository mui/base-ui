'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useProgressIndicator } from './useProgressIndicator';
import { ProgressRoot } from '../root/ProgressRoot';
import { useProgressRootContext } from '../root/ProgressRootContext';
import { progressStyleHookMapping } from '../root/styleHooks';
import { BaseUIComponentProps } from '../../utils/types';

/**
 *
 * Demos:
 *
 * - [Progress](https://base-ui.com/components/react-progress/)
 *
 * API:
 *
 * - [ProgressIndicator API](https://base-ui.com/components/react-progress/#api-reference-ProgressIndicator)
 */
const ProgressIndicator = React.forwardRef(function ProgressIndicator(
  props: ProgressIndicator.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { render, className, ...otherProps } = props;

  const { max, min, value, state } = useProgressRootContext();

  const { getRootProps } = useProgressIndicator({
    max,
    min,
    value,
  });

  const { renderElement } = useComponentRenderer({
    propGetter: getRootProps,
    render: render ?? 'span',
    state,
    className,
    ref: forwardedRef,
    extraProps: otherProps,
    customStyleHookMapping: progressStyleHookMapping,
  });

  return renderElement();
});

namespace ProgressIndicator {
  export interface State extends ProgressRoot.State {}

  export interface Props extends BaseUIComponentProps<'span', State> {}
}

ProgressIndicator.propTypes /* remove-proptypes */ = {
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

export { ProgressIndicator };
