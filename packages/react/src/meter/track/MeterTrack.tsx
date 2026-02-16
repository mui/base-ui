'use client';
import * as React from 'react';
import type { MeterRootState } from '../root/MeterRoot';
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
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, ...elementProps } = componentProps;

  return useRenderElement('div', componentProps, {
    ref: forwardedRef,
    props: elementProps,
  });
});

export interface MeterTrackState {}

export interface MeterTrackProps extends BaseUIComponentProps<'div', MeterRootState> {}

export namespace MeterTrack {
  export type State = MeterTrackState;
  export type Props = MeterTrackProps;
}
