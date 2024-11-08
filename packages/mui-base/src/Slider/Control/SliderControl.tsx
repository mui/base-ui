'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { BaseUIComponentProps } from '../../utils/types.js';
import { useComponentRenderer } from '../../utils/useComponentRenderer.js';
import { useSliderRootContext } from '../Root/SliderRootContext.js';
import { sliderStyleHookMapping } from '../Root/styleHooks.js';
import type { SliderRoot } from '../Root/SliderRoot.js';
import { useSliderControl } from './useSliderControl.js';
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
  export interface Props extends BaseUIComponentProps<'span', SliderRoot.OwnerState> {}
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
