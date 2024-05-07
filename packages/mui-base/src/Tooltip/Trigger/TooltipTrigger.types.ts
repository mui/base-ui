import type { GenericHTMLProps } from '../../utils/BaseUI.types';

export type TooltipTriggerOwnerState = {
  open: boolean;
};

export interface TooltipTriggerProps {
  children: React.ReactElement | ((htmlProps: GenericHTMLProps) => React.ReactElement);
}
