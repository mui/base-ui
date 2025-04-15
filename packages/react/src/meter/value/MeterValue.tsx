'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { mergeProps } from '../../merge-props';
import type { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useMeterRootContext } from '../root/MeterRootContext';
import type { MeterRoot } from '../root/MeterRoot';

const EMPTY = {};
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

  const { value, formattedValue } = useMeterRootContext();

  const getValueProps = React.useCallback(
    (externalProps = {}) =>
      mergeProps(
        {
          'aria-hidden': true,
          children:
            typeof children === 'function'
              ? children(formattedValue, value)
              : ((formattedValue || value) ?? ''),
        },
        externalProps,
      ),
    [children, value, formattedValue],
  );

  const { renderElement } = useComponentRenderer({
    propGetter: getValueProps,
    render: render ?? 'span',
    className,
    state: EMPTY,
    ref: forwardedRef,
    extraProps: otherProps,
  });

  return renderElement();
});

namespace MeterValue {
  export interface Props extends Omit<BaseUIComponentProps<'span', MeterRoot.State>, 'children'> {
    children?: null | ((formattedValue: string, value: number) => React.ReactNode);
  }
}

export { MeterValue };

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
