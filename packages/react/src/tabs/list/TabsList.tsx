'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { BaseUIComponentProps, HTMLProps } from '../../utils/types';
import type { TabsRoot } from '../root/TabsRoot';
import { CompositeRoot } from '../../composite/root/CompositeRoot';
import { tabsStateAttributesMapping } from '../root/stateAttributesMapping';
import { useTabsRootContext } from '../root/TabsRootContext';
import type { TabsTab } from '../tab/TabsTab';
import { TabsListContext } from './TabsListContext';
import { EMPTY_ARRAY } from '../../utils/constants';

/**
 * Groups the individual tab buttons.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Tabs](https://base-ui.com/react/components/tabs)
 */
export const TabsList = React.forwardRef(function TabsList(
  componentProps: TabsList.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    activateOnFocus = false,
    className,
    loopFocus = true,
    render,
    ...elementProps
  } = componentProps;

  const {
    getTabElementBySelectedValue,
    onValueChange,
    orientation,
    setTabsListElement,
    tabsListElement,
    value,
    setTabMap,
    tabActivationDirection,
  } = useTabsRootContext();

  const [highlightedTabIndex, setHighlightedTabIndex] = React.useState(0);

  // Calculate direction for internal tab clicks
  const calculateDirectionForClick = React.useCallback(
    (newValue: TabsTab.Value): TabsTab.ActivationDirection => {
      if (newValue === value || newValue == null || tabsListElement == null) {
        return 'none';
      }

      // Get the current tab's position
      const currentTabElement = getTabElementBySelectedValue(value);
      if (currentTabElement == null) {
        return 'none';
      }

      const { left: currentTabLeft, top: currentTabTop } =
        currentTabElement.getBoundingClientRect();
      const { left: listLeft, top: listTop } = tabsListElement.getBoundingClientRect();
      const currentTabEdge =
        orientation === 'horizontal' ? currentTabLeft - listLeft : currentTabTop - listTop;

      // Get the new tab's position
      const newTabElement = getTabElementBySelectedValue(newValue);
      if (newTabElement == null) {
        return 'none';
      }

      const { left: newTabLeft, top: newTabTop } = newTabElement.getBoundingClientRect();
      const newTabEdge = orientation === 'horizontal' ? newTabLeft - listLeft : newTabTop - listTop;

      // Calculate direction
      if (orientation === 'horizontal') {
        if (newTabEdge < currentTabEdge) {
          return 'left';
        }
        if (newTabEdge > currentTabEdge) {
          return 'right';
        }
      } else {
        if (newTabEdge < currentTabEdge) {
          return 'up';
        }
        if (newTabEdge > currentTabEdge) {
          return 'down';
        }
      }

      return 'none';
    },
    [value, tabsListElement, getTabElementBySelectedValue, orientation],
  );

  const onTabActivation = useStableCallback(
    (newValue: TabsTab.Value, eventDetails: TabsRoot.ChangeEventDetails) => {
      if (newValue !== value) {
        const activationDirection = calculateDirectionForClick(newValue);
        eventDetails.activationDirection = activationDirection;
        onValueChange(newValue, eventDetails);
      }
    },
  );

  const state: TabsList.State = {
    orientation,
    tabActivationDirection,
  };

  const defaultProps: HTMLProps = {
    'aria-orientation': orientation === 'vertical' ? 'vertical' : undefined,
    role: 'tablist',
  };

  const tabsListContextValue: TabsListContext = React.useMemo(
    () => ({
      activateOnFocus,
      highlightedTabIndex,
      onTabActivation,
      setHighlightedTabIndex,
      tabsListElement,
      value,
    }),
    [
      activateOnFocus,
      highlightedTabIndex,
      onTabActivation,
      setHighlightedTabIndex,
      tabsListElement,
      value,
    ],
  );

  return (
    <TabsListContext.Provider value={tabsListContextValue}>
      <CompositeRoot
        render={render}
        className={className}
        state={state}
        refs={[forwardedRef, setTabsListElement]}
        props={[defaultProps, elementProps]}
        stateAttributesMapping={tabsStateAttributesMapping}
        highlightedIndex={highlightedTabIndex}
        enableHomeAndEndKeys
        loopFocus={loopFocus}
        orientation={orientation}
        onHighlightedIndexChange={setHighlightedTabIndex}
        onMapChange={setTabMap}
        disabledIndices={EMPTY_ARRAY as number[]}
      />
    </TabsListContext.Provider>
  );
});

export interface TabsListState extends TabsRoot.State {}

export interface TabsListProps extends BaseUIComponentProps<'div', TabsList.State> {
  /**
   * Whether to automatically change the active tab on arrow key focus.
   * Otherwise, tabs will be activated using <kbd>Enter</kbd> or <kbd>Space</kbd> key press.
   * @default false
   */
  activateOnFocus?: boolean | undefined;
  /**
   * Whether to loop keyboard focus back to the first item
   * when the end of the list is reached while using the arrow keys.
   * @default true
   */
  loopFocus?: boolean | undefined;
}

export namespace TabsList {
  export type State = TabsListState;
  export type Props = TabsListProps;
}
