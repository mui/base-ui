'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useSliderContext } from '../Root/SliderContext';
import type { SliderRoot } from '../Root/SliderRoot';
import { sliderStyleHookMapping } from '../Root/styleHooks';
/**
 *
 * Demos:
 *
 * - [Slider](https://base-ui.netlify.app/components/react-slider/)
 *
 * API:
 *
 * - [SliderTrack API](https://base-ui.netlify.app/components/react-slider/#api-reference-SliderTrack)
 */
const SliderTrack = React.forwardRef(function SliderTrack(
  props: SliderTrack.Props,
  forwardedRef: React.ForwardedRef<HTMLElement>,
) {
  const { render, className, ...otherProps } = props;

  const { ownerState } = useSliderContext();

  const { renderElement } = useComponentRenderer({
    render: render ?? 'span',
    ownerState,
    className,
    ref: forwardedRef,
    extraProps: otherProps,
    customStyleHookMapping: sliderStyleHookMapping,
  });

  return renderElement();
});

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

export namespace SliderTrack {
  export interface Props extends BaseUIComponentProps<'span', SliderRoot.OwnerState> {}
}

export { SliderTrack };
