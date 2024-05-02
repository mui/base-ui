import type { BaseUIComponentProps } from '../../utils/BaseUI.types';
import type {
  TabActivationDirection,
  TabsDirection,
  TabsOrientation,
  TabsRootOwnerState,
} from '../Root/TabsRoot.types';

export type TabPanelOwnerState = TabsRootOwnerState & {
  hidden: boolean;
};

export interface TabPanelProps extends BaseUIComponentProps<'div', TabPanelOwnerState> {
  /**
   * The value of the TabPanel. It will be shown when the Tab with the corresponding value is selected.
   * If not provided, it will fall back to the index of the panel.
   * It is recommended to explicitly provide it, as it's required for the tab panel to be rendered on the server.
   */
  value?: any;
  /**
   * If `true`, keeps the contents of the hidden TabPanel in the DOM.
   * @default false
   */
  keepMounted?: boolean;
}

export interface UseTabPanelParameters {
  /**
   * The id of the TabPanel.
   */
  id?: string;
  /**
   * The ref of the TabPanel.
   */
  rootRef?: React.Ref<HTMLElement>;
  /**
   * The value of the TabPanel. It will be shown when the Tab with the corresponding value is selected.
   */
  value?: any;
}

export interface UseTabPanelReturnValue {
  /**
   * If `true`, it indicates that the tab panel will be hidden.
   */
  hidden: boolean;
  /**
   * Resolver for the root slot's props.
   * @param externalProps additional props for the root slot
   * @returns props that should be spread on the root slot
   */
  getRootProps: (
    externalProps?: React.ComponentPropsWithRef<'div'>,
  ) => React.ComponentPropsWithRef<'div'>;
  rootRef: React.RefCallback<HTMLElement> | null;
  orientation: TabsOrientation;
  direction: TabsDirection;
  tabActivationDirection: TabActivationDirection;
}
