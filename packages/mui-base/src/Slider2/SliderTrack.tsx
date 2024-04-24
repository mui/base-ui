'use client';
import * as React from 'react';
import { evaluateRenderProp } from '../utils/evaluateRenderProp';
import { resolveClassName } from '../utils/resolveClassName';
import { useRenderPropForkRef } from '../utils/useRenderPropForkRef';
import { useSliderContext } from './SliderContext';
import { TrackProps } from './Slider.types';

function defaultRender(props: React.ComponentPropsWithRef<'div'>) {
  return <div {...props} />;
}

const SliderTrack = React.forwardRef(function SliderTrack(
  props: TrackProps,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render: renderProp, className, ...otherProps } = props;

  const render = renderProp ?? defaultRender;

  const { getTrackProps, ownerState } = useSliderContext('Track');

  const mergedRef = useRenderPropForkRef(render, forwardedRef);

  const trackProps = getTrackProps({
    ref: mergedRef,
    className: resolveClassName(className, ownerState),
    ...otherProps,
    // style: {
    //   ...otherProps.style,
    //   ...axisProps[axis].offset(trackOffset),
    //   ...axisProps[axis].leap(trackLeap),
    // },
  });

  return evaluateRenderProp(render, trackProps, ownerState);
});

export { SliderTrack };
