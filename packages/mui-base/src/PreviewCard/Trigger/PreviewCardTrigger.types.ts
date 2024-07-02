import type { BaseUIComponentProps } from '../../utils/types';

export type PreviewCardTriggerOwnerState = {
  open: boolean;
};

export interface PreviewCardTriggerProps
  extends BaseUIComponentProps<'a', PreviewCardTriggerOwnerState> {}
