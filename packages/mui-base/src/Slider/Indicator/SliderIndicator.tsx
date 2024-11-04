'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useSliderRootContext } from '../Root/SliderRootContext';
import { sliderStyleHookMapping } from '../Root/styleHooks';
import type { SliderRoot } from '../Root/SliderRoot';
import { useSliderIndicator } from './useSliderIndicator';
/**
 *
 * Demos:
 *
 * - [Slider](https://base-ui.netlify.app/components/react-slider/)
 *
 * API:
 *
 * - [SliderIndicator API](https://base-ui.netlify.app/components/react-slider/#api-reference-SliderIndicator)
 */
const SliderIndicator = React.forwardRef(function SliderIndicator(
  props: SliderIndicator.Props,
  forwardedRef: React.ForwardedRef<HTMLElement>,
) {
  const { render, className, ...otherProps } = props;

  const { axis, direction, disabled, orientation, ownerState, percentageValues } =
    useSliderRootContext();

  const { getRootProps } = useSliderIndicator({
    axis,
    direction,
    disabled,
    orientation,
    percentageValues,
  });

  const { renderElement } = useComponentRenderer({
    propGetter: getRootProps,
    render: render ?? 'span',
    ownerState,
    className,
    ref: forwardedRef,
    extraProps: otherProps,
    customStyleHookMapping: sliderStyleHookMapping,
  });

  return renderElement();
});

export namespace SliderIndicator {
  export type Props = BaseUIComponentProps<'span', SliderRoot.OwnerState> & {};
}

export { SliderIndicator };

SliderIndicator.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.oneOfType([
    PropTypes.element,
    PropTypes.func,
    PropTypes.number,
    PropTypes.shape({
      '__@toStringTag@620': PropTypes.oneOf(['BigInt']).isRequired,
      toLocaleString: PropTypes.func.isRequired,
      toString: PropTypes.func.isRequired,
      valueOf: PropTypes.func.isRequired,
    }),
    PropTypes.shape({
      '__@iterator@96': PropTypes.func.isRequired,
    }),
    PropTypes.shape({
      children: PropTypes.node,
      key: PropTypes.string,
      props: PropTypes.any.isRequired,
      type: PropTypes.oneOfType([PropTypes.func, PropTypes.string]).isRequired,
    }),
    PropTypes.shape({
      '__@toStringTag@620': PropTypes.string.isRequired,
      catch: PropTypes.func.isRequired,
      finally: PropTypes.func.isRequired,
      then: PropTypes.func.isRequired,
    }),
    PropTypes.string,
    PropTypes.bool,
  ]),
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;
