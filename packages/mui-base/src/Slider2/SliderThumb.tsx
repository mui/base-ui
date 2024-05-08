'use client';
import * as React from 'react';
import { getStyleHookProps } from '../utils/getStyleHookProps';
import { resolveClassName } from '../utils/resolveClassName';
import { useRenderPropForkRef } from '../utils/useRenderPropForkRef';
import { useSliderContext } from './SliderContext';
import { ThumbProps } from './Slider.types';
import { useSliderThumb } from '../useSlider2/useSliderThumb';

function defaultRender(props: React.ComponentPropsWithRef<'div'>) {
  return <div {...props} />;
}

function NOOP() {}

const SliderThumb = React.forwardRef(function SliderThumb(
  props: ThumbProps,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    render: renderProp,
    className,
    children,
    disabled: disabledProp = false,
    id,
    onFocus = NOOP,
    onBlur = NOOP,
    onKeyDown = NOOP,
    ...otherProps
  } = props;

  const render = renderProp ?? defaultRender;

  const mergedRef = useRenderPropForkRef(render, forwardedRef);

  const { ownerState, active: activeIndex } = useSliderContext('Thumb');

  const { getRootProps, getThumbInputProps, disabled, index } = useSliderThumb({
    disabled: disabledProp,
    id,
    rootRef: mergedRef,
  });

  const styleHooks = React.useMemo(
    () => getStyleHookProps({ active: activeIndex === index }),
    [activeIndex, index],
  );

  const thumbProps = getRootProps({
    ...styleHooks,
    ...otherProps,
    className: resolveClassName(className, ownerState),
  });

  const inputProps = getThumbInputProps({ disabled, onFocus, onBlur, onKeyDown });

  return (
    <div {...thumbProps}>
      {children}
      <input {...inputProps} data-index={index} />
    </div>
  );
});

export { SliderThumb };
