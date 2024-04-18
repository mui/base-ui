import type { BaseUIComponentProps } from '../../utils/BaseUI.types';
import type { TabsDirection, TabsOrientation, TabsRootOwnerState } from '../Tabs.types';
import type {
  ActiveTabPosition,
  TabSelectionMovementDirection,
} from '../../useTabIndicator/useTabIndicator.types';

export type TabIndicatorOwnerState = TabsRootOwnerState & {
  selectedTabPosition: ActiveTabPosition | null;
  orientation: TabsOrientation;
  direction: TabsDirection;
  movementDirection: TabSelectionMovementDirection;
};

export interface TabIndicatorProps extends BaseUIComponentProps<'span', TabIndicatorOwnerState> {
  /**
   * If `true`, the indicator will include code to render itself before React hydrates.
   * This will minimize the time the indicator is not visible after the SSR-generated content is downloaded.
   *
   * @default false
   */
  renderBeforeHydration?: boolean;
}
