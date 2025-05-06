'use client';
import * as React from 'react';
import { mergeProps } from '../../merge-props';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { BaseUIComponentProps } from '../../utils/types';
import type { MeterRoot } from '../root/MeterRoot';
import { useMeterRootContext } from '../root/MeterRootContext';

const EMPTY = {};
/**
 * Visualizes the position of the value along the range.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Meter](https://base-ui.com/react/components/meter)
 */
export const MeterIndicator = React.forwardRef(function MeterIndicator(
  props: MeterIndicator.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { render, className, ...otherProps } = props;

  const { percentageValue } = useMeterRootContext();

  const getStyles = React.useCallback(() => {
    return {
      insetInlineStart: 0,
      height: 'inherit',
      width: `${percentageValue}%`,
    };
  }, [percentageValue]);

  const propGetter = React.useCallback(
    (externalProps = {}) =>
      mergeProps<'div'>(
        {
          style: getStyles(),
        },
        externalProps,
      ),
    [getStyles],
  );

  const { renderElement } = useComponentRenderer({
    propGetter,
    render: render ?? 'div',
    state: EMPTY,
    className,
    ref: forwardedRef,
    extraProps: otherProps,
  });

  return renderElement();
});

export namespace MeterIndicator {
  export interface Props extends BaseUIComponentProps<'div', MeterRoot.State> {}
}
