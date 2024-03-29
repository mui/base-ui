import { BaseUiComponentCommonProps } from '../../utils/BaseUiComponentCommonProps';
import { TabsDirection, TabsOrientation } from '../Tabs.types';

export type TabsListOwnerState = {
  direction: TabsDirection;
  orientation: TabsOrientation;
};

export interface TabsListProps extends BaseUiComponentCommonProps<'div', TabsListOwnerState> {
  /**
   * If `true`, the tab will be activated whenever it is focused.
   * Otherwise, it has to be activated by clicking or pressing the Enter or Space key.
   *
   * @default true
   */
  activateOnFocus?: boolean;
  /**
   * If `true`, using keyboard navigation will wrap focus to the other end of the list once the end is reached.
   *
   * @default true
   */
  loop?: boolean;
}
