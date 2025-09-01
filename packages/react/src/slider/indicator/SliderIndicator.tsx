'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../utils/types';
import { valueToPercent } from '../../utils/valueToPercent';
import { useRenderElement } from '../../utils/useRenderElement';
import { useSliderRootContext } from '../root/SliderRootContext';
import { sliderStateAttributesMapping } from '../root/stateAttributesMapping';
import type { SliderRoot } from '../root/SliderRoot';

function getInsetStyles(
  vertical: boolean,
  range: boolean,
  start: number | undefined,
  end: number | undefined,
): React.CSSProperties {
  const visibility = start === undefined || (range && end === undefined) ? 'hidden' : undefined;

  if (!range) {
    if (vertical) {
      return {
        visibility,
        position: 'absolute',
        bottom: 0,
        height: `${start ?? 0}%`,
        width: 'inherit',
      };
    }

    return {
      visibility,
      position: 'relative',
      insetInlineStart: 0,
      width: `${start}%`,
      height: 'inherit',
    };
  }

  const size = (end ?? 0) - (start ?? 0);

  if (vertical) {
    return {
      visibility,
      position: 'absolute',
      bottom: `${start}%`,
      height: `${size}%`,
      width: 'inherit',
    };
  }

  return {
    visibility,
    position: 'relative',
    insetInlineStart: `${start}%`,
    width: `${size}%`,
    height: 'inherit',
  };
}

function getCenteredStyles(
  vertical: boolean,
  range: boolean,
  start: number,
  end: number,
): React.CSSProperties {
  if (!range) {
    if (vertical) {
      return {
        position: 'absolute',
        bottom: 0,
        height: `${start}%`,
        width: 'inherit',
      };
    }

    return {
      position: 'relative',
      insetInlineStart: 0,
      width: `${start}%`,
      height: 'inherit',
    };
  }

  const size = end - start;

  if (vertical) {
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

  const vertical = orientation === 'vertical';
  const range = values.length > 1;

  const style = inset
    ? getInsetStyles(vertical, range, indicatorPosition[0], indicatorPosition[1])
    : getCenteredStyles(
        vertical,
        range,
        valueToPercent(values[0], min, max),
        valueToPercent(values[values.length - 1], min, max),
      );

  const element = useRenderElement('div', componentProps, {
    state,
    ref: forwardedRef,
    props: [{ style }, elementProps],
    stateAttributesMapping: sliderStateAttributesMapping,
  });

  return element;
});

export namespace SliderIndicator {
  export interface Props extends BaseUIComponentProps<'div', SliderRoot.State> {}
}
