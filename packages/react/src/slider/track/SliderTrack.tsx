'use client';
import * as React from 'react';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
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
  componentProps: SliderTrack.Props,
  forwardedRef: React.ForwardedRef<HTMLElement>,
) {
  const { render, className, ...elementProps } = componentProps;

  const { state } = useSliderRootContext();

  const renderElement = useRenderElement('div', componentProps, {
    state,
    ref: forwardedRef,
    props: [
      {
        style: {
          position: 'relative',
        },
      },
      elementProps,
    ],
    customStyleHookMapping: sliderStyleHookMapping,
  });

  return renderElement();
});

namespace SliderTrack {
  export interface Props extends BaseUIComponentProps<'div', SliderRoot.State> {}
}

export { SliderTrack };
