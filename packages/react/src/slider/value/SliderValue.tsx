'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useSliderRootContext } from '../root/SliderRootContext';
import { sliderStyleHookMapping } from '../root/styleHooks';
import type { SliderRoot } from '../root/SliderRoot';
import { useSliderValue } from './useSliderValue';
/**
 *
 * Documentation: [Base UI Slider](https://base-ui.com/react/components/slider)
 */
const SliderValue = React.forwardRef(function SliderValue(
  props: SliderValue.Props,
  forwardedRef: React.ForwardedRef<HTMLOutputElement>,
) {
  const { render, className, children, ...otherProps } = props;

  const { inputIdMap, state, values, format } = useSliderRootContext();

  const { getRootProps, formattedValues } = useSliderValue({
    format,
    inputIdMap,
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

export namespace SliderValue {
  export interface Props
    extends Omit<BaseUIComponentProps<'output', SliderRoot.State>, 'children'> {
    children?:
      | null
      | ((formattedValues: readonly string[], values: readonly number[]) => React.ReactNode);
  }
}

export { SliderValue };

SliderValue.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.func,
  /**
   * CSS class applied to the element, or a function that
   * returns a class based on the component’s state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   *
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;
