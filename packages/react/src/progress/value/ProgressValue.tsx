'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { mergeReactProps } from '../../utils/mergeReactProps';
import type { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useProgressRootContext } from '../root/ProgressRootContext';
import type { ProgressRoot } from '../root/ProgressRoot';
import { progressStyleHookMapping } from '../root/styleHooks';
/**
 * A text label displaying the current value.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Progress](https://base-ui.com/react/components/progress)
 */
const ProgressValue = React.forwardRef(function ProgressValue(
  props: ProgressValue.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { className, render, children, ...otherProps } = props;

  const { value, formattedValue, state } = useProgressRootContext();

  const getValueProps = React.useCallback(
    (externalProps = {}) => {
      const formattedValueArg = value == null ? 'indeterminate' : formattedValue;
      const formattedValueDisplay = value == null ? null : formattedValue;
      return mergeReactProps(externalProps, {
        'aria-hidden': true,
        children:
          typeof children === 'function'
            ? children(formattedValueArg, value)
            : formattedValueDisplay,
      });
    },
    [children, value, formattedValue],
  );

  const { renderElement } = useComponentRenderer({
    propGetter: getValueProps,
    render: render ?? 'span',
    className,
    state,
    ref: forwardedRef,
    extraProps: otherProps,
    customStyleHookMapping: progressStyleHookMapping,
  });

  return renderElement();
});

ProgressValue.propTypes /* remove-proptypes */ = {
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
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   *
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

namespace ProgressValue {
  export interface State extends ProgressRoot.State {}

  export interface Props extends Omit<BaseUIComponentProps<'span', State>, 'children'> {
    children?: null | ((formattedValue: string | null, value: number | null) => React.ReactNode);
  }
}

export { ProgressValue };
