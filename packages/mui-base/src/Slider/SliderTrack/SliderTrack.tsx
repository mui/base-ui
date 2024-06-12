'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { evaluateRenderProp } from '../../utils/evaluateRenderProp';
import { getStyleHookProps } from '../../utils/getStyleHookProps';
import { resolveClassName } from '../../utils/resolveClassName';
import { useRenderPropForkRef } from '../../utils/useRenderPropForkRef';
import { useSliderContext } from '../Root/SliderProvider';
import { SliderTrackProps } from './SliderTrack.types';
import { useSliderTrack } from './useSliderTrack';

function defaultRender(props: React.ComponentPropsWithRef<'span'>) {
  return <span {...props} />;
}

const SliderTrack = React.forwardRef(function SliderTrack(
  props: SliderTrackProps,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render: renderProp, className, ...otherProps } = props;

  const render = renderProp ?? defaultRender;

  const mergedRef = useRenderPropForkRef(render, forwardedRef);

  const {
    areValuesEqual,
    disabled,
    dragging,
    getFingerNewValue,
    handleValueChange,
    minDifferenceBetweenValues,
    onValueCommitted,
    orientation,
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
    rootRef: mergedRef,
    setActive,
    setDragging,
    setOpen,
    setValueState,
    subitems,
  });

  const styleHooks = React.useMemo(
    () => getStyleHookProps({ disabled, dragging, orientation }),
    [disabled, dragging, orientation],
  );

  const trackProps = getRootProps({
    ...styleHooks,
    ...otherProps,
    className: resolveClassName(className, ownerState),
  });

  return evaluateRenderProp(render, trackProps, ownerState);
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
