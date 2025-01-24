'use client';
import * as React from 'react';
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

namespace MeterValue {
  export interface State extends MeterRoot.State {}

  export interface Props extends Omit<BaseUIComponentProps<'span', State>, 'children'> {
    children?: null | ((formattedValue: string, value: number) => React.ReactNode);
  }
}

export { MeterValue };
