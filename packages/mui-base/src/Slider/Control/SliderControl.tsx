'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useSliderRootContext } from '../Root/SliderRootContext';
import { sliderStyleHookMapping } from '../Root/styleHooks';
import type { SliderRoot } from '../Root/SliderRoot';
import { useSliderControl } from './useSliderControl';
/**
 *
 * Demos:
 *
 * - [Slider](https://base-ui.netlify.app/components/react-slider/)
 *
 * API:
 *
 * - [SliderControl API](https://base-ui.netlify.app/components/react-slider/#api-reference-SliderControl)
 */
const SliderControl = React.forwardRef(function SliderControl(
  props: SliderControl.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render: renderProp, className, ...otherProps } = props;

  const {
    areValuesEqual,
    disabled,
    dragging,
    getFingerNewValue,
    handleValueChange,
    minStepsBetweenValues,
    onValueCommitted,
    ownerState,
    percentageValues,
    registerSliderControl,
    setActive,
    setDragging,
    setValueState,
    step,
    thumbRefs,
  } = useSliderRootContext();

  const { getRootProps } = useSliderControl({
    areValuesEqual,
    disabled,
    dragging,
    getFingerNewValue,
    handleValueChange,
    minStepsBetweenValues,
    onValueCommitted,
    percentageValues,
    registerSliderControl,
    rootRef: forwardedRef,
    setActive,
    setDragging,
    setValueState,
    step,
    thumbRefs,
  });

  const { renderElement } = useComponentRenderer({
    propGetter: getRootProps,
    render: renderProp ?? 'span',
    ownerState,
    className,
    extraProps: otherProps,
    customStyleHookMapping: sliderStyleHookMapping,
  });

  return renderElement();
});

export namespace SliderControl {
  export type Props = BaseUIComponentProps<'span', SliderRoot.OwnerState> & {};
}

export { SliderControl };

SliderControl.propTypes /* remove-proptypes */ = {
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
