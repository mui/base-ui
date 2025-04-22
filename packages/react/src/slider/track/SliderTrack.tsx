'use client';
import * as React from 'react';
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
export const SliderTrack = React.forwardRef(function SliderTrack(
  props: SliderTrack.Props,
  forwardedRef: React.ForwardedRef<HTMLElement>,
) {
  const { render, className, ...otherProps } = props;

  const { state } = useSliderRootContext();

  const { renderElement } = useComponentRenderer({
    render: render ?? 'div',
    state,
    className,
    ref: forwardedRef,
    extraProps: {
      ...otherProps,
      style: {
        position: 'relative',
        ...otherProps.style,
      },
    },
    customStyleHookMapping: sliderStyleHookMapping,
  });

  return renderElement();
});

export namespace SliderTrack {
  export interface Props extends BaseUIComponentProps<'div', SliderRoot.State> {}
}
