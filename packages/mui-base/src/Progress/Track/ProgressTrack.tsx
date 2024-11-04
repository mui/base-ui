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

  export type Props = BaseUIComponentProps<'span', OwnerState> & {};
}

ProgressTrack.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
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
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { ProgressTrack };
