'use client';
import * as React from 'react';
import type { BaseUIComponentProps, Orientation } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useSliderRootContext } from '../root/SliderRootContext';
import { sliderMapping } from '../root/stateAttributesMapping';
import type { SliderRoot } from '../root/SliderRoot';
import { valueArrayToPercentages } from '../utils/valueArrayToPercentages';

function getRangeStyles(
  orientation: Orientation,
  offset: number,
  leap: number,
): React.CSSProperties {
  if (orientation === 'vertical') {
    return {
      position: 'absolute',
      bottom: `${offset}%`,
      height: `${leap}%`,
      width: 'inherit',
    };
  }

  return {
    position: 'relative',
    insetInlineStart: `${offset}%`,
    width: `${leap}%`,
    height: 'inherit',
  };
}

/**
 * Visualizes the current value of the slider.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Slider](https://base-ui.com/react/components/slider)
 */
export const SliderIndicator = React.forwardRef(function SliderIndicator(
  componentProps: SliderIndicator.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, ...elementProps } = componentProps;

  const { max, min, orientation, state, values } = useSliderRootContext();

  const percentageValues = valueArrayToPercentages(values.slice(), min, max);

  let style: React.CSSProperties;

  if (percentageValues.length > 1) {
    const trackOffset = percentageValues[0];
    const trackLeap = percentageValues[percentageValues.length - 1] - trackOffset;

    style = getRangeStyles(orientation, trackOffset, trackLeap);
  } else if (orientation === 'vertical') {
    style = {
      position: 'absolute',
      bottom: 0,
      height: `${percentageValues[0]}%`,
      width: 'inherit',
    };
  } else {
    style = {
      position: 'relative',
      insetInlineStart: 0,
      width: `${percentageValues[0]}%`,
      height: 'inherit',
    };
  }

  const element = useRenderElement('div', componentProps, {
    state,
    ref: forwardedRef,
    props: [{ style }, elementProps],
    stateAttributesMapping: sliderMapping,
  });

  return element;
});

export namespace SliderIndicator {
  export interface Props extends BaseUIComponentProps<'div', SliderRoot.State> {}
}
