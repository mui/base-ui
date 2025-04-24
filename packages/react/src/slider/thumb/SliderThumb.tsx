'use client';
import * as React from 'react';
import { getStyleHookProps } from '../../utils/getStyleHookProps';
import { mergeProps } from '../../merge-props';
import { NOOP } from '../../utils/noop';
import { resolveClassName } from '../../utils/resolveClassName';
import { BaseUIComponentProps } from '../../utils/types';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useForkRef } from '../../utils/useForkRef';
import type { SliderRoot } from '../root/SliderRoot';
import { useSliderRootContext } from '../root/SliderRootContext';
import { useSliderThumb } from './useSliderThumb';
import { isReactVersionAtLeast } from '../../utils/reactVersion';

function defaultRender(
  props: React.ComponentPropsWithRef<'div'>,
  inputProps: React.ComponentPropsWithRef<'input'>,
) {
  const { children, ...thumbProps } = props;
  return (
    <div {...thumbProps}>
      {children}
      <input {...inputProps} />
    </div>
  );
}

/**
 * The draggable part of the the slider at the tip of the indicator.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Slider](https://base-ui.com/react/components/slider)
 */
export const SliderThumb = React.forwardRef(function SliderThumb(
  props: SliderThumb.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    render: renderProp,
    className,
    disabled: disabledProp = false,
    getAriaLabel: getAriaLabelProp,
    getAriaValueText: getAriaValueTextProp,
    id: idProp,
    inputId: inputIdProp,
    onBlur: onBlurProp,
    onFocus: onFocusProp,
    onKeyDown: onKeyDownProp,
    tabIndex: tabIndexProp,
    ...otherProps
  } = props;

  const id = useBaseUiId(idProp);
  const inputId = useBaseUiId(inputIdProp);

  const render = renderProp ?? defaultRender;

  const {
    active: activeIndex,
    'aria-labelledby': ariaLabelledby,
    handleInputChange,
    disabled: contextDisabled,
    format = null,
    largeStep,
    max,
    min,
    minStepsBetweenValues,
    name,
    orientation,
    state,
    step,
    tabIndex: contextTabIndex,
    values,
  } = useSliderRootContext();

  let renderPropRef = null;
  if (typeof render !== 'function') {
    renderPropRef = isReactVersionAtLeast(19) ? (render.props as any).ref : render.ref;
  }

  const mergedRef = useForkRef(renderPropRef, forwardedRef);

  const { getRootProps, getThumbInputProps, disabled, index } = useSliderThumb({
    active: activeIndex,
    'aria-label': props['aria-label'],
    'aria-labelledby': ariaLabelledby,
    'aria-valuetext': props['aria-valuetext'],
    handleInputChange,
    disabled: disabledProp || contextDisabled,
    format,
    getAriaLabel: getAriaLabelProp ?? null,
    getAriaValueText: getAriaValueTextProp ?? null,
    id,
    inputId,
    largeStep,
    max,
    min,
    minStepsBetweenValues,
    name,
    onBlur: onBlurProp ?? NOOP,
    onFocus: onFocusProp ?? NOOP,
    onKeyDown: onKeyDownProp ?? NOOP,
    orientation,
    rootRef: mergedRef,
    step,
    tabIndex: tabIndexProp ?? contextTabIndex,
    values,
  });

  const styleHooks = React.useMemo(
    () => getStyleHookProps({ disabled, dragging: index !== -1 && activeIndex === index }),
    [activeIndex, disabled, index],
  );

  const thumbProps = getRootProps({
    ...styleHooks,
    ...otherProps,
    className: resolveClassName(className, state),
  });

  const inputProps = getThumbInputProps({ disabled });

  if (typeof render === 'function') {
    return render(thumbProps, inputProps, state);
  }

  const { children: renderPropsChildren, ...otherRenderProps } =
    render.props as React.PropsWithChildren<unknown>;

  const children = thumbProps.children ?? renderPropsChildren;

  return React.cloneElement(render, {
    ...mergeProps(
      {
        ...thumbProps,
        children: (
          <React.Fragment>
            {/* @ts-ignore */}
            {typeof children === 'function' ? children() : children}
            <input {...inputProps} />
          </React.Fragment>
        ),
      },
      otherRenderProps,
    ),
    // @ts-ignore
    ref: thumbProps.ref,
  });
});

export namespace SliderThumb {
  export interface State extends SliderRoot.State {}

  export interface Props
    extends Partial<Omit<useSliderThumb.Parameters, 'rootRef'>>,
      Omit<BaseUIComponentProps<'div', State>, 'render' | 'tabIndex'> {
    onPointerLeave?: React.PointerEventHandler;
    onPointerOver?: React.PointerEventHandler;
    onBlur?: React.FocusEventHandler;
    onFocus?: React.FocusEventHandler;
    onKeyDown?: React.KeyboardEventHandler;
    /**
     * Allows you to replace the component’s HTML element
     * with a different tag, or compose it with another component.
     *
     * Accepts a `ReactElement` or a function that returns the element to render.
     */
    render?:
      | ((
          props: React.ComponentPropsWithRef<'div'>,
          inputProps: React.ComponentPropsWithRef<'input'>,
          state: State,
        ) => React.ReactElement)
      | (React.ReactElement & { ref: React.Ref<Element> });
  }
}
