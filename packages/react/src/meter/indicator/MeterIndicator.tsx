'use client';
import * as React from 'react';
import { BaseUIComponentProps } from '../../utils/types';
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

  const { percentageValue } = useMeterRootContext();

  return useRenderElement('div', componentProps, {
    ref: forwardedRef,
    props: [
      {
        style: {
          insetInlineStart: 0,
          height: 'inherit',
          width: `${percentageValue}%`,
        },
      },
      elementProps,
    ],
  });
});

export namespace MeterIndicator {
  export interface Props extends BaseUIComponentProps<'div', MeterRoot.State> {}
}
