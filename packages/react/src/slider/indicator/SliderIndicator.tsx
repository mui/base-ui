'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../internals/types';
import { valueToPercent } from '../../utils/valueToPercent';
import { useIsHydrating } from '../../utils/useIsHydrating';
import { useRenderElement } from '../../internals/useRenderElement';
import { useSliderRootContext } from '../root/SliderRootContext';
import { sliderStateAttributesMapping } from '../root/stateAttributesMapping';
import type { SliderRootState } from '../root/SliderRoot';

function getIndicatorStyles(
  vertical: boolean,
  range: boolean,
  inset: boolean,
  start: number | undefined,
  end: number | undefined,
  forceHidden: boolean,
): React.CSSProperties & Record<string, unknown> {
  const styles: React.CSSProperties & Record<string, unknown> = {
    visibility:
      forceHidden || (inset && (start === undefined || (range && end === undefined)))
        ? ('hidden' as const)
        : undefined,
    position: vertical ? 'absolute' : 'relative',
    [vertical ? 'width' : 'height']: 'inherit',
  };

  let startValue: string = `${start ?? 0}%`;
  let sizeValue: string = `${(end ?? 0) - (start ?? 0)}%`;

  if (inset) {
    styles['--start-position'] = startValue;
    startValue = 'var(--start-position)';

    if (range) {
      styles['--relative-size'] = sizeValue;
      sizeValue = 'var(--relative-size)';
    }
  }

  styles[vertical ? 'bottom' : 'insetInlineStart'] = range ? startValue : 0;
  styles[vertical ? 'height' : 'width'] = range ? sizeValue : startValue;

  return styles;
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
  const { render, className, style: styleProp, ...elementProps } = componentProps;

  const { indicatorPosition, inset, max, min, orientation, renderBeforeHydration, state, values } =
    useSliderRootContext();

  const isHydrating = useIsHydrating();

  const vertical = orientation === 'vertical';
  const range = values.length > 1;

  const style = getIndicatorStyles(
    vertical,
    range,
    inset,
    inset ? indicatorPosition[0] : valueToPercent(values[0], min, max),
    inset ? indicatorPosition[1] : valueToPercent(values[values.length - 1], min, max),
    inset && renderBeforeHydration && isHydrating,
  );

  const element = useRenderElement('div', componentProps, {
    state,
    ref: forwardedRef,
    props: [
      {
        ['data-base-ui-slider-indicator' as string]: renderBeforeHydration ? '' : undefined,
        style,
        suppressHydrationWarning: renderBeforeHydration || undefined,
      },
      elementProps,
    ],
    stateAttributesMapping: sliderStateAttributesMapping,
  });

  return element;
});

export interface SliderIndicatorState extends SliderRootState {}

export interface SliderIndicatorProps extends BaseUIComponentProps<'div', SliderIndicatorState> {}

export namespace SliderIndicator {
  export type State = SliderIndicatorState;
  export type Props = SliderIndicatorProps;
}
