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
 * Demos:
 *
 * - [Slider](https://base-ui.com/components/react-slider/)
 *
 * API:
 *
 * - [SliderValue API](https://base-ui.com/components/react-slider/#api-reference-SliderValue)
 */
const SliderValue = React.forwardRef(function SliderValue(
  props: SliderValue.Props,
  forwardedRef: React.ForwardedRef<HTMLOutputElement>,
) {
  const { render, className, ...otherProps } = props;

  const { inputIdMap, state, values, format } = useSliderRootContext();

  const { getRootProps, formattedValues } = useSliderValue({
    format,
    inputIdMap,
    values,
  });

  const { renderElement } = useComponentRenderer({
    propGetter: getRootProps,
    render: render ?? 'output',
    state,
    className,
    ref: forwardedRef,
    extraProps: {
      children: formattedValues,
      ...otherProps,
    },
    customStyleHookMapping: sliderStyleHookMapping,
  });

  return renderElement();
});

export namespace SliderValue {
  export interface Props extends BaseUIComponentProps<'output', SliderRoot.State> {}
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
  children: PropTypes.node,
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;
