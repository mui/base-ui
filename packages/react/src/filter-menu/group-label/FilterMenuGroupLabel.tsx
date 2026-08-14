'use client';
import * as React from 'react';
import { MenuGroupLabel, type MenuGroupLabelProps } from '../../menu/group-label/MenuGroupLabel';

export const FilterMenuGroupLabel = React.forwardRef(function FilterMenuGroupLabel(
  props: FilterMenuGroupLabel.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  return <MenuGroupLabel {...props} ref={forwardedRef} />;
});

export interface FilterMenuGroupLabelProps extends MenuGroupLabelProps {}

export namespace FilterMenuGroupLabel {
  export type Props = FilterMenuGroupLabelProps;
  export type State = MenuGroupLabel.State;
}
