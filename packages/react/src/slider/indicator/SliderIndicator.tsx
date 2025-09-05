'use client';
import * as React from 'react';
import type { BaseUIComponentProps, Orientation } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useSliderRootContext } from '../root/SliderRootContext';
import { sliderStyleHookMapping } from '../root/styleHooks';
import type { SliderRoot } from '../root/SliderRoot';
import { valueArrayToPercentages } from '../utils/valueArrayToPercentages';

function getStyles(
  orientation: Orientation,
  range: boolean,
  inset: boolean,
  percentageValues: number[],
  indicatorPosition: (number | undefined)[],
): React.CSSProperties {
  const visibility =
    inset && (indicatorPosition[0] === undefined || (range && indicatorPosition[1] === undefined))
      ? 'hidden'
      : undefined;

  if (range) {
    const start = inset ? (indicatorPosition[0] ?? 0) : percentageValues[0];
    const end = inset ? (indicatorPosition[1] ?? 0) : percentageValues[percentageValues.length - 1];
    const size = end - start;

    if (orientation === 'vertical') {
      return {
        position: 'absolute',
        bottom: `${start}%`,
        height: `${size}%`,
        width: 'inherit',
      };
    }

    return {
      position: 'relative',
      insetInlineStart: `${start}%`,
      width: `${size}%`,
      height: 'inherit',
    };
  }

  const value = inset ? (indicatorPosition[0] ?? 0) : percentageValues[0];

  if (orientation === 'vertical') {
    return {
      visibility,
      position: 'absolute',
      bottom: 0,
      height: `${value}%`,
      width: 'inherit',
    };
  }

  return {
    visibility,
    position: 'relative',
    insetInlineStart: 0,
    width: `${value}%`,
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

  const { max, min, indicatorPosition, inset, orientation, state, values } = useSliderRootContext();

  const range = values.length > 1;
  const percentageValues = valueArrayToPercentages(values.slice(), min, max);

  const style = getStyles(orientation, range, inset, percentageValues, indicatorPosition);

  const element = useRenderElement('div', componentProps, {
    state,
    ref: forwardedRef,
    props: [{ style }, elementProps],
    customStyleHookMapping: sliderStyleHookMapping,
  });

  return element;
});

export namespace SliderIndicator {
  export interface Props extends BaseUIComponentProps<'div', SliderRoot.State> {}
}
