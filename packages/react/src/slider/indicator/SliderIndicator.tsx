'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useSliderRootContext } from '../root/SliderRootContext';
import { sliderStyleHookMapping } from '../root/styleHooks';
import type { SliderRoot } from '../root/SliderRoot';
import { useSliderIndicator } from './useSliderIndicator';

/**
 * Visualizes the current value of the slider.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Slider](https://base-ui.com/react/components/slider)
 */
const SliderIndicator = React.forwardRef(function SliderIndicator(
  props: SliderIndicator.Props,
  forwardedRef: React.ForwardedRef<HTMLElement>,
) {
  const { render, className, ...otherProps } = props;

  const { disabled, max, min, orientation, state, values } = useSliderRootContext();

  const { getRootProps } = useSliderIndicator({
    disabled,
    max,
    min,
    orientation,
    values,
  });

  const { renderElement } = useComponentRenderer({
    propGetter: getRootProps,
    render: render ?? 'div',
    state,
    className,
    ref: forwardedRef,
    extraProps: otherProps,
    customStyleHookMapping: sliderStyleHookMapping,
  });

  return renderElement();
});

namespace SliderIndicator {
  export interface Props extends BaseUIComponentProps<'div', SliderRoot.State> {}
}

export { SliderIndicator };
