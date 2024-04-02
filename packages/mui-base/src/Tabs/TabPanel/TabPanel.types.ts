import type { BaseUIComponentProps } from '../../utils/BaseUI.types';
import type { TabsDirection, TabsOrientation } from '../Tabs.types';

export type TabPanelOwnerState = {
  hidden: boolean;
  orientation: TabsOrientation;
  direction: TabsDirection;
};

export interface TabPanelProps extends BaseUIComponentProps<'div', TabPanelOwnerState> {
  /**
   * The value of the TabPanel. It will be shown when the Tab with the corresponding value is selected.
   * If not provided, it will fall back to the index of the panel.
   * It is recommended to explicitly provide it, as it's required for the tab panel to be rendered on the server.
   */
  value?: number | string;
  /**
   * If `true`, keeps the contents of the hidden TabPanel in the DOM.
   * @default false
   */
  keepMounted?: boolean;
}
