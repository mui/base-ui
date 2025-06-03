'use client';
import * as React from 'react';
import type { MeterRoot } from '../root/MeterRoot';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';

/**
 * Contains the meter indicator and represents the entire range of the meter.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Meter](https://base-ui.com/react/components/meter)
 */
export const MeterTrack = React.forwardRef(function MeterTrack(
  componentProps: MeterTrack.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { render, className, ...elementProps } = componentProps;

  return useRenderElement('div', componentProps, {
    ref: forwardedRef,
    props: elementProps,
  });
});

export namespace MeterTrack {
  export interface Props extends BaseUIComponentProps<'div', MeterRoot.State> {}
}
