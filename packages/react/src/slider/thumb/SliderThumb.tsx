'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { getStyleHookProps } from '../../utils/getStyleHookProps';
import { mergeProps } from '../../utils/mergeProps';
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
const SliderThumb = React.forwardRef(function SliderThumb(
  props: SliderThumb.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    render: renderProp,
    'aria-label': ariaLabel,
    'aria-valuetext': ariaValuetext,
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
    percentageValues,
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
    'aria-label': ariaLabel ?? '',
    'aria-labelledby': ariaLabelledby ?? '',
    'aria-valuetext': ariaValuetext ?? '',
    handleInputChange,
    disabled: disabledProp || contextDisabled,
    format,
    getAriaLabel: getAriaLabelProp ?? null,
    getAriaValueText: getAriaValueTextProp ?? null,
    id: id ?? '',
    inputId: inputId ?? '',
    largeStep,
    max,
    min,
    minStepsBetweenValues,
    name,
    onBlur: onBlurProp ?? NOOP,
    onFocus: onFocusProp ?? NOOP,
    onKeyDown: onKeyDownProp ?? NOOP,
    orientation,
    percentageValues,
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

namespace SliderThumb {
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

export { SliderThumb };

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
   * CSS class applied to the element, or a function that
   * returns a class based on the component’s state.
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
   * @type {((index: number) => string) | null}
   */
  getAriaLabel: PropTypes.func,
  /**
   * Accepts a function which returns a string value that provides a user-friendly name for the current value of the slider.
   * This is important for screen reader users.
   * @param {string} formattedValue The thumb's formatted value.
   * @param {number} value The thumb's numerical value.
   * @param {number} index The thumb's index.
   * @returns {string}
   * @type {((formattedValue: string, value: number, index: number) => string) | null}
   */
  getAriaValueText: PropTypes.func,
  /**
   * @ignore
   */
  id: PropTypes.string,
  /**
   * @ignore
   */
  inputId: PropTypes.string,
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
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   *
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render: PropTypes /* @typescript-to-proptypes-ignore */.oneOfType([
    PropTypes.func,
    PropTypes.node,
  ]),
  /**
   * Optional tab index attribute for the thumb components.
   * @default null
   */
  tabIndex: PropTypes.number,
} as any;
