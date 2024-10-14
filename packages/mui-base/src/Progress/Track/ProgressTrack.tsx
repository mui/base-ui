'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useProgressRootContext } from '../Root/ProgressRootContext';
import { progressStyleHookMapping } from '../Root/styleHooks';
import { ProgressRoot } from '../Root/ProgressRoot';
import { BaseUIComponentProps } from '../../utils/types';

/**
 *
 * Demos:
 *
 * - [Progress](https://base-ui.netlify.app/components/react-progress/)
 *
 * API:
 *
 * - [ProgressTrack API](https://base-ui.netlify.app/components/react-progress/#api-reference-ProgressTrack)
 */
const ProgressTrack = React.forwardRef(function ProgressTrack(
  props: ProgressTrack.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { render, className, ...otherProps } = props;

  const { ownerState } = useProgressRootContext();

  const { renderElement } = useComponentRenderer({
    render: render ?? 'span',
    ownerState,
    className,
    ref: forwardedRef,
    extraProps: otherProps,
    customStyleHookMapping: progressStyleHookMapping,
  });

  return renderElement();
});

namespace ProgressTrack {
  export interface OwnerState extends ProgressRoot.OwnerState {}

  export interface Props extends BaseUIComponentProps<'span', OwnerState> {}
}

ProgressTrack.propTypes /* remove-proptypes */ = {
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

export { ProgressTrack };
