'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useSliderRootContext } from '../root/SliderRootContext';
import { sliderStyleHookMapping } from '../root/styleHooks';
import type { SliderRoot } from '../root/SliderRoot';
import { useSliderValue } from './useSliderValue';
/**
 * Displays the current value of the slider as text.
 * Renders an `<output>` element.
 *
 * Documentation: [Base UI Slider](https://base-ui.com/react/components/slider)
 */
const SliderValue = React.forwardRef(function SliderValue(
  props: SliderValue.Props,
  forwardedRef: React.ForwardedRef<HTMLOutputElement>,
) {
  const { 'aria-live': ariaLive = 'off', render, className, children, ...otherProps } = props;

  const { thumbMap, state, values, format } = useSliderRootContext();

  const { getRootProps, formattedValues } = useSliderValue({
    'aria-live': ariaLive,
    format: format ?? null,
    thumbMap,
    values,
  });

  const defaultDisplayValue = React.useMemo(() => {
    const arr = [];
    for (let i = 0; i < values.length; i += 1) {
      arr.push(formattedValues[i] || values[i]);
    }
    return arr.join(' – ');
  }, [values, formattedValues]);

  const { renderElement } = useComponentRenderer({
    propGetter: getRootProps,
    render: render ?? 'output',
    state,
    className,
    ref: forwardedRef,
    extraProps: {
      children:
        typeof children === 'function' ? children(formattedValues, values) : defaultDisplayValue,
      ...otherProps,
    },
    customStyleHookMapping: sliderStyleHookMapping,
  });

  return renderElement();
});

namespace SliderValue {
  export interface Props
    extends Omit<BaseUIComponentProps<'output', SliderRoot.State>, 'children'> {
    /**
     * @default 'off'
     */
    'aria-live'?: React.AriaAttributes['aria-live'];
    children?:
      | null
      | ((formattedValues: readonly string[], values: readonly number[]) => React.ReactNode);
  }
}

export { SliderValue };
