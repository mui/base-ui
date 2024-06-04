'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { getStyleHookProps } from '../../utils/getStyleHookProps';
import { resolveClassName } from '../../utils/resolveClassName';
import { useRenderPropForkRef } from '../../utils/useRenderPropForkRef';
import { useSliderContext } from '../Root/SliderProvider';
import { SliderThumbProps } from './SliderThumb.types';
import { useSliderThumb } from './useSliderThumb';

function defaultRender(props: React.ComponentPropsWithRef<'span'>) {
  return <span {...props} />;
}

const SliderThumb = React.forwardRef(function SliderThumb(
  props: SliderThumbProps,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const {
    render: renderProp,
    'aria-label': ariaLabel,
    'aria-valuetext': ariaValuetext,
    className,
    children,
    disabled: disabledProp = false,
    getAriaLabel,
    getAriaValueText,
    id,
    ...otherProps
  } = props;

  const render = renderProp ?? defaultRender;

  const mergedRef = useRenderPropForkRef(render, forwardedRef);

  const {
    active: activeIndex,
    'aria-labelledby': ariaLabelledby,
    axis,
    changeValue,
    disabled: contextDisabled,
    isRtl,
    largeStep,
    max,
    min,
    name,
    orientation,
    ownerState,
    percentageValues,
    scale,
    setOpen,
    step,
    tabIndex,
    values,
  } = useSliderContext();

  const { getRootProps, getThumbInputProps, disabled, index } = useSliderThumb({
    active: activeIndex,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
    'aria-valuetext': ariaValuetext,
    axis,
    changeValue,
    disabled: disabledProp || contextDisabled,
    getAriaLabel,
    getAriaValueText,
    id,
    isRtl,
    largeStep,
    max,
    min,
    name,
    orientation,
    percentageValues,
    rootRef: mergedRef,
    scale,
    setOpen,
    step,
    tabIndex,
    values,
  });

  const styleHooks = React.useMemo(
    () => getStyleHookProps({ disabled, dragging: activeIndex === index }),
    [activeIndex, disabled, index],
  );

  const thumbProps = getRootProps({
    ...styleHooks,
    ...otherProps,
    className: resolveClassName(className, ownerState),
  });

  const inputProps = getThumbInputProps({ disabled });

  return (
    <span {...thumbProps}>
      {children}
      <input {...inputProps} />
    </span>
  );
});

SliderThumb.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * The label for the input element.
   */
  'aria-label': PropTypes.string,
  /**
   * A string value that provides a user-friendly name for the current value of the slider.
   */
  'aria-valuetext': PropTypes.string,
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * @ignore
   */
  disabled: PropTypes.bool,
  /**
   * Accepts a function which returns a string value that provides a user-friendly name for the input associated with the thumb
   * @param {number} index The index of the input
   * @returns {string}
   */
  getAriaLabel: PropTypes.func,
  /**
   * Accepts a function which returns a string value that provides a user-friendly name for the current value of the slider.
   * This is important for screen reader users.
   * @param {number} value The thumb label's value to format.
   * @param {number} index The thumb label's index to format.
   * @returns {string}
   */
  getAriaValueText: PropTypes.func,
  /**
   * @ignore
   */
  id: PropTypes.string,
  /**
   * @ignore
   */
  onBlur: PropTypes.func,
  /**
   * @ignore
   */
  onFocus: PropTypes.func,
  /**
   * @ignore
   */
  onKeyDown: PropTypes.func,
  /**
   * @ignore
   */
  onPointerLeave: PropTypes.func,
  /**
   * @ignore
   */
  onPointerOver: PropTypes.func,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { SliderThumb };
