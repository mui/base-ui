'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useSliderContext } from '../Root/SliderProvider';
import { sliderStyleHookMapping } from '../Root/styleHooks';
import { SliderIndicatorProps } from './SliderIndicator.types';
import { useSliderIndicator } from './useSliderIndicator';

/**
 *
 * Demos:
 *
 * - [Slider](https://base-ui.netlify.app/components/react-slider/)
 *
 * API:
 *
 * - [SliderIndicator API](https://base-ui.netlify.app/components/react-slider/#api-reference-SliderIndicator)
 */
const SliderIndicator = React.forwardRef(function SliderIndicator(
  props: SliderIndicatorProps,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { render, className, ...otherProps } = props;

  const { axis, direction, disabled, orientation, ownerState, percentageValues } =
    useSliderContext();

  const { getRootProps } = useSliderIndicator({
    axis,
    direction,
    disabled,
    orientation,
    percentageValues,
  });

  const { renderElement } = useComponentRenderer({
    propGetter: getRootProps,
    render: render ?? 'span',
    ownerState,
    className,
    ref: forwardedRef,
    extraProps: otherProps,
    customStyleHookMapping: sliderStyleHookMapping,
  });

  return renderElement();
});

SliderIndicator.propTypes /* remove-proptypes */ = {
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

export { SliderIndicator };
