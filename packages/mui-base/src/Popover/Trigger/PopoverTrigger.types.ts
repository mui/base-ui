import type { BaseUIComponentProps } from '../../utils/types';

export type PopoverTriggerOwnerState = {
  open: boolean;
};

export interface PopoverTriggerProps extends BaseUIComponentProps<any, PopoverTriggerOwnerState> {}
