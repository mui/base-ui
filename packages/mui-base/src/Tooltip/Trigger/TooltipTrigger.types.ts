import type { BaseUIComponentProps } from '../../utils/types';

export type TooltipTriggerOwnerState = {
  open: boolean;
};

export interface TooltipTriggerProps extends BaseUIComponentProps<any, TooltipTriggerOwnerState> {}
