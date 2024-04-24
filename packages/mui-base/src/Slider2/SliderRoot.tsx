'use client';
import * as React from 'react';
import { evaluateRenderProp } from '../utils/evaluateRenderProp';
import { getStyleHookProps } from '../utils/getStyleHookProps';
import { resolveClassName } from '../utils/resolveClassName';
import { useRenderPropForkRef } from '../utils/useRenderPropForkRef';
import { CompoundComponentContext } from '../useCompound';
import { useSlider } from '../useSlider2';
import { SliderContext } from './SliderContext';
import { RootProps, SliderOwnerState } from './Slider.types';

function defaultRender(props: React.ComponentPropsWithRef<'div'>) {
  return <div {...props} />;
}

const SliderRoot = React.forwardRef(function SliderRoot(
  props: RootProps,
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

  const { compoundComponentContextValue, ...slider } = useSlider({
    defaultValue,
    disabled,
    onValueChange,
    rootRef: mergedRef,
    value,
    ...otherProps,
  });

  const ownerState: SliderOwnerState = React.useMemo(
    () => ({
      disabled,
      max: slider.max,
      min: slider.min,
      value: slider.value,
    }),
    [disabled, slider.max, slider.min, slider.value],
  );

  const styleHooks = React.useMemo(() => getStyleHookProps({ disabled }), [disabled]);

  const rootProps = slider.getRootProps({
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
    <CompoundComponentContext.Provider value={compoundComponentContextValue}>
      <SliderContext.Provider value={contextValue}>
        {evaluateRenderProp(render, rootProps, ownerState)}
      </SliderContext.Provider>
    </CompoundComponentContext.Provider>
  );
});

export { SliderRoot };
