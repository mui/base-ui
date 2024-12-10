'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useSliderRootContext } from '../root/SliderRootContext';
import type { SliderRoot } from '../root/SliderRoot';
import { sliderStyleHookMapping } from '../root/styleHooks';

/**
 * Contains the slider indicator and represents the entire range of the slider.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Slider](https://base-ui.com/react/components/slider)
 */
const SliderTrack = React.forwardRef(function SliderTrack(
  props: SliderTrack.Props,
  forwardedRef: React.ForwardedRef<HTMLElement>,
) {
  const { render, className, ...otherProps } = props;

  const { state } = useSliderRootContext();

  const { renderElement } = useComponentRenderer({
    render: render ?? 'span',
    state,
    className,
    ref: forwardedRef,
    extraProps: otherProps,
    customStyleHookMapping: sliderStyleHookMapping,
  });

  return renderElement();
});

export namespace SliderTrack {
  export interface Props extends BaseUIComponentProps<'span', SliderRoot.State> {}
}

export { SliderTrack };

SliderTrack.propTypes /* remove-proptypes */ = {
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
