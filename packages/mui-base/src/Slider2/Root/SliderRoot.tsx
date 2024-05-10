'use client';
import * as React from 'react';
import { evaluateRenderProp } from '../../utils/evaluateRenderProp';
import { getStyleHookProps } from '../../utils/getStyleHookProps';
import { resolveClassName } from '../../utils/resolveClassName';
import { useRenderPropForkRef } from '../../utils/useRenderPropForkRef';
import { useSliderRoot } from './useSliderRoot';
import { SliderProvider } from './SliderProvider';
import { SliderRootProps, SliderRootOwnerState } from './SliderRoot.types';

function defaultRender(props: React.ComponentPropsWithRef<'div'>) {
  return <div {...props} />;
}

const SliderRoot = React.forwardRef(function SliderRoot(
  props: SliderRootProps,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    className,
    defaultValue,
    disabled = false,
    render: renderProp,
    onValueChange,
    value,
    ...otherProps
  } = props;

  const render = renderProp ?? defaultRender;

  const mergedRef = useRenderPropForkRef(render, forwardedRef);

  const { getRootProps, ...slider } = useSliderRoot({
    defaultValue,
    disabled,
    onValueChange,
    rootRef: mergedRef,
    value,
    ...otherProps,
  });

  const ownerState: SliderRootOwnerState = React.useMemo(
    () => ({
      disabled,
      dragging: slider.dragging,
      max: slider.max,
      min: slider.min,
      value: slider.value,
    }),
    [disabled, slider.dragging, slider.max, slider.min, slider.value],
  );

  const styleHooks = React.useMemo(
    () => getStyleHookProps({ disabled, dragging: slider.dragging }),
    [disabled, slider.dragging],
  );

  const rootProps = getRootProps({
    ...styleHooks,
    ...otherProps,
    className: resolveClassName(className, ownerState),
  });

  const contextValue = React.useMemo(
    () => ({
      ...slider,
      ownerState,
    }),
    [slider, ownerState],
  );

  return (
    <SliderProvider value={contextValue}>
      {evaluateRenderProp(render, rootProps, ownerState)}
    </SliderProvider>
  );
});

export { SliderRoot as Slider };
