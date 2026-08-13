'use client';
import * as React from 'react';
import {
  SelectPositioner,
  type SelectPositionerProps,
  type SelectPositionerState,
} from '../../select/positioner/SelectPositioner';

export const FilterSelectPositioner = React.forwardRef(function FilterSelectPositioner(
  componentProps: FilterSelectPositioner.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  return <SelectPositioner {...componentProps} alignItemWithTrigger={false} ref={forwardedRef} />;
});

export interface FilterSelectPositionerState extends SelectPositionerState {}

export interface FilterSelectPositionerProps extends Omit<
  SelectPositionerProps,
  'alignItemWithTrigger'
> {}

export namespace FilterSelectPositioner {
  export type Props = FilterSelectPositionerProps;
  export type State = FilterSelectPositionerState;
}
