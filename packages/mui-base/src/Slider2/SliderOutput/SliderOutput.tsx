'use client';
import * as React from 'react';
import { evaluateRenderProp } from '../../utils/evaluateRenderProp';
import { resolveClassName } from '../../utils/resolveClassName';
import { useRenderPropForkRef } from '../../utils/useRenderPropForkRef';
import { useSliderContext } from '../Root/SliderContext';
import { SliderOutputProps } from './SliderOutput.types';
import { useSliderOutput } from './useSliderOutput';

function defaultRender(props: React.ComponentPropsWithRef<'output'>) {
  return <output {...props} />;
}

const SliderOutput = React.forwardRef(function SliderOutput(
  props: SliderOutputProps,
  forwardedRef: React.ForwardedRef<HTMLOutputElement>,
) {
  const { render: renderProp, className, ...otherProps } = props;

  const render = renderProp ?? defaultRender;

  const { ownerState, value } = useSliderContext('Output');

  const mergedRef = useRenderPropForkRef(render, forwardedRef);

  const valueDisplay = Array.isArray(value) ? value.join(' – ') : String(value);

  const { getRootProps } = useSliderOutput({
    rootRef: mergedRef,
  });

  const outputProps = getRootProps({
    className: resolveClassName(className, ownerState),
    children: valueDisplay,
    ...otherProps,
  });

  return evaluateRenderProp(render, outputProps, ownerState);
});

export { SliderOutput };
