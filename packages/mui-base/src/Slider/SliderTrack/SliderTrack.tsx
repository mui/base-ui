'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useSliderContext } from '../Root/SliderProvider';
import { sliderStyleHookMapping } from '../Root/styleHooks';
import { SliderTrackProps } from './SliderTrack.types';
import { useSliderTrack } from './useSliderTrack';

const SliderTrack = React.forwardRef(function SliderTrack(
  props: SliderTrackProps,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render: renderProp, className, ...otherProps } = props;

  const {
    areValuesEqual,
    disabled,
    dragging,
    getFingerNewValue,
    handleValueChange,
    minDifferenceBetweenValues,
    onValueCommitted,
    ownerState,
    percentageValues,
    registerSliderTrack,
    setActive,
    setDragging,
    setOpen,
    setValueState,
    subitems,
  } = useSliderContext();

  const { getRootProps } = useSliderTrack({
    areValuesEqual,
    disabled,
    dragging,
    getFingerNewValue,
    handleValueChange,
    minDifferenceBetweenValues,
    onValueCommitted,
    percentageValues,
    registerSliderTrack,
    rootRef: forwardedRef,
    setActive,
    setDragging,
    setOpen,
    setValueState,
    subitems,
  });

  const { renderElement } = useComponentRenderer({
    propGetter: getRootProps,
    render: renderProp ?? 'span',
    ownerState,
    className,
    ref: forwardedRef,
    extraProps: {
      ...otherProps,
    },
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

export { SliderTrack };
