import type { BaseUiComponentCommonProps } from '@mui/base/utils/BaseUiComponentCommonProps';
import type { TabsDirection, TabsOrientation, TabsOwnerState } from '../Tabs.types';
import type { SelectedTabPosition } from './useBubble.types';

export type TabsBubbleOwnerState = TabsOwnerState & {
  selectedTabPosition: SelectedTabPosition | null;
  orientation: TabsOrientation;
  direction: TabsDirection;
};

export interface TabsBubbleProps extends BaseUiComponentCommonProps<'span', TabsBubbleOwnerState> {}
