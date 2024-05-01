'use client';
import * as React from 'react';
import { evaluateRenderProp } from '../utils/evaluateRenderProp';
import { resolveClassName } from '../utils/resolveClassName';
import { useRenderPropForkRef } from '../utils/useRenderPropForkRef';
import { useSliderContext } from './SliderContext';
import { OutputProps } from './Slider.types';

function defaultRender(props: React.ComponentPropsWithRef<'output'>) {
  return <output {...props} />;
}

const SliderOutput = React.forwardRef(function SliderOutput(
  props: OutputProps,
  forwardedRef: React.ForwardedRef<HTMLOutputElement>,
) {
  const { render: renderProp, className, ...otherProps } = props;

  const render = renderProp ?? defaultRender;

  const { getOutputProps, ownerState, value } = useSliderContext('Output');

  const mergedRef = useRenderPropForkRef(render, forwardedRef);

  const valueDisplay = Array.isArray(value) ? value.join('–') : String(value);

  const outputProps = getOutputProps({
    ref: mergedRef,
    className: resolveClassName(className, ownerState),
    children: valueDisplay,
    ...otherProps,
  });

  return evaluateRenderProp(render, outputProps, ownerState);
});

export { SliderOutput };
