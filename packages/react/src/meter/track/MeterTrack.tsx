'use client';
import * as React from 'react';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { MeterRoot } from '../root/MeterRoot';
import { BaseUIComponentProps } from '../../utils/types';

const EMPTY = {};
/**
 * Contains the meter indicator and represents the entire range of the meter.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Meter](https://base-ui.com/react/components/meter)
 */
export const MeterTrack = React.forwardRef(function MeterTrack(
  props: MeterTrack.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { render, className, ...otherProps } = props;

  const { renderElement } = useComponentRenderer({
    render: render ?? 'div',
    state: EMPTY,
    className,
    ref: forwardedRef,
    extraProps: otherProps,
  });

  return renderElement();
});

export namespace MeterTrack {
  export interface Props extends BaseUIComponentProps<'div', MeterRoot.State> {}
}
