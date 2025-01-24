'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { mergeReactProps } from '../../utils/mergeReactProps';
import type { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useProgressRootContext } from '../root/ProgressRootContext';
import type { ProgressRoot } from '../root/ProgressRoot';
/**
 * A text element displaying the current value.
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
    (externalProps = {}) =>
      mergeReactProps(externalProps, {
        'aria-hidden': true,
        children:
          typeof children === 'function'
            ? children(formattedValue, value)
            : ((formattedValue || value) ?? ''),
      }),
    [children, value, formattedValue],
  );

  const { renderElement } = useComponentRenderer({
    propGetter: getValueProps,
    render: render ?? 'span',
    className,
    state,
    ref: forwardedRef,
    extraProps: otherProps,
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
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * A function to customize rendering of the component.
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
