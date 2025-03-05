'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useSelectRootContext } from '../root/SelectRootContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { BaseUIComponentProps } from '../../utils/types';
import { useForkRef } from '../../utils/useForkRef';
import { mergeProps } from '../../utils/mergeProps';

/**
 * A text label of the currently selected item.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
const SelectValue = React.forwardRef(function SelectValue(
  props: SelectValue.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { className, render, children, placeholder, ...otherProps } = props;

  const { label, valueRef } = useSelectRootContext();

  const mergedRef = useForkRef(forwardedRef, valueRef);

  const state: SelectValue.State = React.useMemo(() => ({}), []);

  const getValueProps = React.useCallback(
    (externalProps = {}) =>
      mergeProps(
        {
          children: typeof children === 'function' ? children(label) : label || placeholder,
        },
        externalProps,
      ),
    [children, label, placeholder],
  );

  const { renderElement } = useComponentRenderer({
    propGetter: getValueProps,
    render: render ?? 'span',
    className,
    state,
    ref: mergedRef,
    extraProps: otherProps,
  });

  return renderElement();
});

namespace SelectValue {
  export interface Props extends Omit<BaseUIComponentProps<'span', State>, 'children'> {
    children?: null | ((value: string) => React.ReactNode);
    /**
     * A placeholder value to display when no value is selected.
     *
     * You can use this prop to pre-render the displayed text
     * during SSR in order to avoid the hydration flash.
     */
    placeholder?: string;
  }

  export interface State {}
}

SelectValue.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.func,
  /**
   * CSS class applied to the element, or a function that
   * returns a class based on the component’s state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * A placeholder value to display when no value is selected.
   *
   * You can use this prop to pre-render the displayed text
   * during SSR in order to avoid the hydration flash.
   */
  placeholder: PropTypes.string,
  /**
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   *
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { SelectValue };
