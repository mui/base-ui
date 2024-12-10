'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useSliderRootContext } from '../root/SliderRootContext';
import type { SliderRoot } from '../root/SliderRoot';
import { sliderStyleHookMapping } from '../root/styleHooks';
/**
 *
 * Demos:
 *
 * - [Slider](https://base-ui.com/components/react-slider/)
 *
 * API:
 *
 * - [SliderTrack API](https://base-ui.com/components/react-slider/#api-reference-SliderTrack)
 */
const SliderTrack = React.forwardRef(function SliderTrack(
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

export { SliderTrack };

SliderTrack.propTypes /* remove-proptypes */ = {
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
