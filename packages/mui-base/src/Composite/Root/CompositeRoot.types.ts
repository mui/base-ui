import type { BaseUIComponentProps } from '../../utils/types';

export type CompositeRootOwnerState = {};

export interface CompositeRootProps extends BaseUIComponentProps<'div', CompositeRootOwnerState> {
  orientation?: 'horizontal' | 'vertical';
  cols?: number;
  loop?: boolean;
  activeIndex?: number;
  onActiveIndexChange?: (index: number) => void;
}
