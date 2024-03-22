import { BaseUiComponentCommonProps } from '../utils/BaseUiComponentCommonProps';

export type TabPanelOwnerState = {
  hidden: boolean;
};

export interface TabPanelProps extends BaseUiComponentCommonProps<'div', TabPanelOwnerState> {
  /**
   * The value of the TabPanel. It will be shown when the Tab with the corresponding value is selected.
   * If not provided, it will fall back to the index of the panel.
   * It is recommended to explicitly provide it, as it's required for the tab panel to be rendered on the server.
   */
  value?: number | string;
}
