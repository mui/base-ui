import type { BaseUIComponentProps } from '../../utils/types';

export type HoverCardTriggerOwnerState = {
  open: boolean;
};

export interface HoverCardTriggerProps
  extends BaseUIComponentProps<'a', HoverCardTriggerOwnerState> {}
