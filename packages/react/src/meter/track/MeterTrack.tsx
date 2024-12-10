'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useMeterRootContext } from '../root/MeterRootContext';
import { MeterRoot } from '../root/MeterRoot';
import { meterStyleHookMapping } from '../root/styleHooks';
import { BaseUIComponentProps } from '../../utils/types';
/**
 *
 * Demos:
 *
 * - [Meter](https://base-ui.com/components/react-meter/)
 *
 * API:
 *
 * - [MeterTrack API](https://base-ui.com/components/react-meter/#api-reference-MeterTrack)
 */
const MeterTrack = React.forwardRef(function MeterTrack(
  props: MeterTrack.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { render, className, ...otherProps } = props;

  const { state } = useMeterRootContext();

  const { renderElement } = useComponentRenderer({
    render: render ?? 'span',
    state,
    className,
    ref: forwardedRef,
    extraProps: otherProps,
    customStyleHookMapping: meterStyleHookMapping,
  });

  return renderElement();
});

namespace MeterTrack {
  export interface State extends MeterRoot.State {}

  export interface Props extends BaseUIComponentProps<'span', State> {}
}

export { MeterTrack };

MeterTrack.propTypes /* remove-proptypes */ = {
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
