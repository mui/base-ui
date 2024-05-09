'use client';
import * as React from 'react';
import { evaluateRenderProp } from '../utils/evaluateRenderProp';
import { resolveClassName } from '../utils/resolveClassName';
import { useRenderPropForkRef } from '../utils/useRenderPropForkRef';
import { useSliderContext } from './SliderContext';
import { TrackProps } from './Slider.types';
import { useSliderTrack } from '../useSlider2/useSliderTrack';

function defaultRender(props: React.ComponentPropsWithRef<'div'>) {
  return <div {...props} />;
}

const SliderTrack = React.forwardRef(function SliderTrack(
  props: TrackProps,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render: renderProp, className, ...otherProps } = props;

  const render = renderProp ?? defaultRender;

  const mergedRef = useRenderPropForkRef(render, forwardedRef);

  const { ownerState } = useSliderContext('Track');

  const { getRootProps } = useSliderTrack({
    rootRef: mergedRef,
  });

  const trackProps = getRootProps({
    className: resolveClassName(className, ownerState),
    ...otherProps,
  });

  return evaluateRenderProp(render, trackProps, ownerState);
});

export { SliderTrack };
