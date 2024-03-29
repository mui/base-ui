import type { BaseUiComponentCommonProps } from '@mui/base/utils/BaseUiComponentCommonProps';
import type { TabsDirection, TabsOrientation, TabsOwnerState } from '../Tabs.types';
import type { SelectedTabPosition } from '../../useTabBubble/useTabBubble.types';

export type TabBubbleOwnerState = TabsOwnerState & {
  selectedTabPosition: SelectedTabPosition | null;
  orientation: TabsOrientation;
  direction: TabsDirection;
};

export interface TabBubbleProps extends BaseUiComponentCommonProps<'span', TabBubbleOwnerState> {}
