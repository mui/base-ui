'use client';
import { MenuGroupLabel, type MenuGroupLabelProps } from '../../menu/group-label/MenuGroupLabel';

export const FilterMenuGroupLabel = MenuGroupLabel;

export interface FilterMenuGroupLabelProps extends MenuGroupLabelProps {}

export namespace FilterMenuGroupLabel {
  export type Props = FilterMenuGroupLabelProps;
  export type State = MenuGroupLabel.State;
}
