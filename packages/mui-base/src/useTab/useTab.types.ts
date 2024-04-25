import * as React from 'react';
import { type TabsOrientation } from '../useTabs';

export interface UseTabParameters {
  /**
   * The value of the tab.
   * It's used to associate the tab with a tab panel(s) with the same value.
   * If the value is not provided, it falls back to the position index.
   */
  value?: any;
  /**
   * If `true`, the tab will be disabled.
   */
  onChange?: (event: React.SyntheticEvent, value: any) => void;
  /**
   * Callback fired when the tab is clicked.
   */
  onClick?: React.MouseEventHandler;
  /**
   * If `true`, the tab will be disabled.
   */
  disabled?: boolean;
  /**
   * The id of the tab.
   * If not provided, it will be automatically generated.
   */
  id?: string;
  /**
   * Ref to the root slot's DOM element.
   */
  rootRef?: React.Ref<Element>;
}

export interface UseTabReturnValue {
  /**
   * Resolver for the root slot's props.
   * @param externalProps props for the root slot
   * @returns props that should be spread on the root slot
   */
  getRootProps: (
    externalProps?: React.ComponentPropsWithRef<'button'>,
  ) => React.ComponentPropsWithRef<'button'>;
  /**
   * 0-based index of the tab in the list of tabs.
   */
  index: number;
  orientation: TabsOrientation;
  /**
   * Ref to the root slot's DOM element.
   */
  rootRef: React.RefCallback<Element> | null;
  /**
   * If `true`, the tab is selected.
   */
  selected: boolean;
  /**
   * Total number of tabs in the nearest parent TabsList.
   * This can be used to determine if the tab is the last one to style it accordingly.
   */
  totalTabsCount: number;
}
