'use client';
import * as React from 'react';
import { formatNumber } from '@base-ui/utils/formatNumber';
import { useStore } from '@base-ui/utils/store';
import type { CompositeMetadata } from '../../internals/composite/list/CompositeList';
import type { ThumbMetadata } from '../thumb/SliderThumb';
import type { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { useSliderRootContext } from '../root/SliderRootContext';
import { sliderStateAttributesMapping } from '../root/stateAttributesMapping';
import type { SliderRootState } from '../root/SliderRoot';

/**
 * Displays the current value of the slider as text.
 * Renders an `<output>` element.
 *
 * Documentation: [Base UI Slider](https://base-ui.com/react/components/slider)
 */
export const SliderValue = React.forwardRef(function SliderValue(
  componentProps: SliderValue.Props,
  forwardedRef: React.ForwardedRef<HTMLOutputElement>,
) {
  const {
    'aria-live': ariaLive = 'off',
    render,
    className,
    children,
    style,
    ...elementProps
  } = componentProps;

  const { thumbMapStore, state, values, format, locale } = useSliderRootContext();

  const outputFor = useStore(thumbMapStore, selectOutputFor);

  const formattedValues = React.useMemo(
    () => values.map((v) => formatNumber(v, locale, format)),
    [format, locale, values],
  );

  const defaultDisplayValue = formattedValues.join(' – ');

  const element = useRenderElement('output', componentProps, {
    state,
    ref: forwardedRef,
    props: [
      {
        // off by default because it will keep announcing when the slider is being dragged
        // and also when the value is changing (but not yet committed)
        'aria-live': ariaLive,
        children:
          typeof children === 'function' ? children(formattedValues, values) : defaultDisplayValue,
        htmlFor: outputFor,
      },
      elementProps,
    ],
    stateAttributesMapping: sliderStateAttributesMapping,
  });

  return element;
});

function selectOutputFor(thumbMap: Map<Node, CompositeMetadata<ThumbMetadata>>) {
  return (
    Array.from(thumbMap.values(), ({ inputId }) => inputId)
      .join(' ')
      .trim() || undefined
  );
}

export interface SliderValueState extends SliderRootState {}

export interface SliderValueProps extends Omit<
  BaseUIComponentProps<'output', SliderValueState>,
  'children'
> {
  children?:
    | null
    | ((formattedValues: readonly string[], values: readonly number[]) => React.ReactNode)
    | undefined;
}

export namespace SliderValue {
  export type State = SliderValueState;
  export type Props = SliderValueProps;
}
