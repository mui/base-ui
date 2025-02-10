'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { mergeProps } from '../../merge-props';
import type { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useMeterRootContext } from '../root/MeterRootContext';
import type { MeterRoot } from '../root/MeterRoot';
/**
 * A text element displaying the current value.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Meter](https://base-ui.com/react/components/meter)
 */
const MeterValue = React.forwardRef(function MeterValue(
  props: MeterValue.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { className, render, children, ...otherProps } = props;

  const { value, formattedValue, state } = useMeterRootContext();

  const getValueProps = React.useCallback(
    (externalProps = {}) =>
      mergeProps(externalProps, {
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

MeterValue.propTypes /* remove-proptypes */ = {
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

namespace MeterValue {
  export interface State extends MeterRoot.State {}

  export interface Props extends Omit<BaseUIComponentProps<'span', State>, 'children'> {
    children?: null | ((formattedValue: string, value: number) => React.ReactNode);
  }
}

export { MeterValue };
