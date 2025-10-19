'use client';
import * as React from 'react';
import { BaseUIComponentProps } from '../../utils/types';
import { valueToPercent } from '../../utils/valueToPercent';
import type { MeterRoot } from '../root/MeterRoot';
import { useMeterRootContext } from '../root/MeterRootContext';
import { useRenderElement } from '../../utils/useRenderElement';

/**
 * Visualizes the position of the value along the range.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Meter](https://base-ui.com/react/components/meter)
 */
export const MeterIndicator = React.forwardRef(function MeterIndicator(
  componentProps: MeterIndicator.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, ...elementProps } = componentProps;

  const context = useMeterRootContext();

  const percentageWidth = valueToPercent(context.value, context.min, context.max);

  return useRenderElement('div', componentProps, {
    ref: forwardedRef,
    props: [
      {
        style: {
          insetInlineStart: 0,
          height: 'inherit',
          width: `${percentageWidth}%`,
        },
      },
      elementProps,
    ],
  });
});

export interface MeterIndicatorProps extends BaseUIComponentProps<'div', MeterRoot.State> {}

export namespace MeterIndicator {
  export type Props = MeterIndicatorProps;
}
