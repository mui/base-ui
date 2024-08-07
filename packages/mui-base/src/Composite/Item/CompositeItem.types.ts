import type { BaseUIComponentProps } from '../../utils/types';

export type CompositeItemOwnerState = {
  active: boolean;
};

export interface CompositeItemProps extends BaseUIComponentProps<'div', CompositeItemOwnerState> {}
