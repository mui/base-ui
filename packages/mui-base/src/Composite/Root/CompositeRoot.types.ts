import type { BaseUIComponentProps } from '../../utils/types';
import type { Dimensions } from '../composite';

export type CompositeRootOwnerState = {};

export interface CompositeRootProps extends BaseUIComponentProps<'div', CompositeRootOwnerState> {
  orientation?: 'horizontal' | 'vertical';
  cols?: number;
  loop?: boolean;
  activeIndex?: number;
  onActiveIndexChange?: (index: number) => void;
  itemSizes?: Dimensions[];
  dense?: boolean;
}
