import type * as React from 'react';
import type { TabsListProviderValue } from './TabsListProvider';
import type { ListAction } from '../useList';
import type { TabsDirection, TabsOrientation } from '../useTabs';

export interface UseTabsListParameters {
  /**
   * If `true`, the tab will be activated whenever it is focused.
   * Otherwise, it has to be activated by clicking or pressing the Enter or Space key.
   */
  activateOnFocus: boolean;
  /**
   * If `true`, using keyboard navigation will wrap focus to the other end of the list once the end is reached.
   */
  loop: boolean;
  /**
   * Ref to the root element.
   */
  rootRef: React.Ref<Element>;
}

export interface UseTabsListReturnValue {
  /**
   * The value to be passed to the TabListProvider above all the tabs.
   */
  contextValue: TabsListProviderValue;
  /**
   * Action dispatcher for the tabs list component.
   * Allows to programmatically control the tabs list.
   */
  dispatch: (action: ListAction<any>) => void;
  /**
   * Resolver for the root slot's props.
   * @param externalProps props for the root slot
   * @returns props that should be spread on the root slot
   */
  getRootProps: (
    externalProps?: React.ComponentPropsWithRef<'div'>,
  ) => React.ComponentPropsWithRef<'div'>;
  /**
   * The value of the currently highlighted tab.
   */
  highlightedValue: any | null;
  /**
   * If `true`, it will indicate that the text's direction in right-to-left.
   */
  direction: TabsDirection;
  /**
   * The component orientation (layout flow direction).
   */
  orientation: TabsOrientation;
  rootRef: React.RefCallback<Element> | null;
  /**
   * The value of the currently selected tab.
   */
  selectedValue: any | null;
}

export const TabsListActionTypes = {
  valueChange: 'valueChange',
} as const;

export interface ValueChangeAction {
  type: typeof TabsListActionTypes.valueChange;
  value: any | null;
}
