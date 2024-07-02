import * as React from 'react';
import { TabsOrientation } from '../Root/TabsRoot.types';
import { BaseUIComponentProps } from '../../utils/types';
import { ListItemMetadata } from '../../useList';
import type { TabsReducerAction, TabsReducerState } from '../TabsList/tabsListReducer';
import { CompoundParentContextValue } from '../../useCompound';

export type TabOwnerState = {
  disabled: boolean;
  selected: boolean;
  orientation: TabsOrientation;
};

export type TabMetadata = ListItemMetadata;

export interface TabProps extends BaseUIComponentProps<'button', TabOwnerState> {
  /**
   * You can provide your own value. Otherwise, it falls back to the child position index.
   */
  value?: any;
}

export interface UseTabParameters {
  /**
   * The value of the tab.
   * It's used to associate the tab with a tab panel(s) with the same value.
   * If the value is not provided, it falls back to the position index.
   */
  value?: any;
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
  state: TabsReducerState;
  dispatch: React.Dispatch<TabsReducerAction>;
  compoundParentContext: CompoundParentContextValue<any, TabMetadata>;
  orientation: TabsOrientation;
  getTabPanelId: (value: any) => string | undefined;
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
  orientation: TabsOrientation;
  /**
   * Ref to the root slot's DOM element.
   */
  rootRef: React.RefCallback<Element> | null;
  /**
   * If `true`, the tab is selected.
   */
  selected: boolean;
  value: any;
}
