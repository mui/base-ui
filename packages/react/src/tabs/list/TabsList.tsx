'use client';
import * as React from 'react';
import { useEventCallback } from '@base-ui-components/utils/useEventCallback';
import { useIsoLayoutEffect } from '@base-ui-components/utils/useIsoLayoutEffect';
import { BaseUIComponentProps, HTMLProps } from '../../utils/types';
import { CompositeRoot } from '../../composite/root/CompositeRoot';
import { CompositeMetadata } from '../../composite/list/CompositeList';
import { tabsStyleHookMapping } from '../root/styleHooks';
import { useTabsRootContext } from '../root/TabsRootContext';
import type { TabsRoot } from '../root/TabsRoot';
import type { TabsTab } from '../tab/TabsTab';
import { TabsListContext } from './TabsListContext';

const EMPTY_ARRAY: number[] = [];

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
    activateOnFocus = true,
    className,
    loop = true,
    render,
    ...elementProps
  } = componentProps;

  const {
    getTabElementBySelectedValue,
    onValueChange,
    orientation,
    value,
    setTabMap,
    tabActivationDirection,
  } = useTabsRootContext();

  const [highlightedTabIndex, setHighlightedTabIndex] = React.useState(0);
  const [, setTabMapInternal] = React.useState(
    () => new Map<Node, CompositeMetadata<TabsTab.Metadata> | null>(),
  );

  const tabsListRef = React.useRef<HTMLElement>(null);

  const detectActivationDirection = useActivationDirectionDetector(
    value, // the old value
    orientation,
    tabsListRef,
    getTabElementBySelectedValue,
  );

  const onTabActivation = useEventCallback((newValue: any, event: Event) => {
    if (newValue !== value) {
      const activationDirection = detectActivationDirection(newValue);
      onValueChange(newValue, activationDirection, event);
    }
  });

  // Combine the tab map updates to send to both local state and parent
  const handleTabMapChange = React.useCallback(
    (newMap: Map<Node, CompositeMetadata<TabsTab.Metadata> | null>) => {
      setTabMapInternal(newMap);
      setTabMap(newMap);
    },
    [setTabMap],
  );

  const state: TabsList.State = React.useMemo(
    () => ({
      orientation,
      tabActivationDirection,
    }),
    [orientation, tabActivationDirection],
  );

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
      tabsListRef,
      value,
    }),
    [
      activateOnFocus,
      highlightedTabIndex,
      onTabActivation,
      setHighlightedTabIndex,
      tabsListRef,
      value,
    ],
  );

  return (
    <TabsListContext.Provider value={tabsListContextValue}>
      <CompositeRoot
        render={render}
        className={className}
        state={state}
        refs={[forwardedRef, tabsListRef]}
        props={[defaultProps, elementProps]}
        customStyleHookMapping={tabsStyleHookMapping}
        highlightedIndex={highlightedTabIndex}
        enableHomeAndEndKeys
        loop={loop}
        orientation={orientation}
        onHighlightedIndexChange={setHighlightedTabIndex}
        onMapChange={handleTabMapChange}
        disabledIndices={EMPTY_ARRAY}
        ignoreDisabledOnInit
      />
    </TabsListContext.Provider>
  );
});

function getInset(tab: HTMLElement, tabsList: HTMLElement) {
  const { left: tabLeft, top: tabTop } = tab.getBoundingClientRect();
  const { left: listLeft, top: listTop } = tabsList.getBoundingClientRect();

  const left = tabLeft - listLeft;
  const top = tabTop - listTop;

  return { left, top };
}

function useActivationDirectionDetector(
  // the old value
  selectedTabValue: any,
  orientation: TabsRoot.Orientation,
  tabsListRef: React.RefObject<HTMLElement | null>,
  getTabElement: (selectedValue: any) => HTMLElement | null,
): (newValue: any) => TabsTab.ActivationDirection {
  const previousTabEdge = React.useRef<number | null>(null);

  useIsoLayoutEffect(() => {
    // Whenever orientation changes, reset the state.
    if (selectedTabValue == null || tabsListRef.current == null) {
      previousTabEdge.current = null;
      return;
    }

    const activeTab = getTabElement(selectedTabValue);
    if (activeTab == null) {
      previousTabEdge.current = null;
      return;
    }

    const { left, top } = getInset(activeTab, tabsListRef.current);
    previousTabEdge.current = orientation === 'horizontal' ? left : top;
  }, [orientation, getTabElement, tabsListRef, selectedTabValue]);

  return React.useCallback(
    (newValue: any) => {
      if (newValue === selectedTabValue) {
        return 'none';
      }

      if (newValue == null) {
        previousTabEdge.current = null;
        return 'none';
      }

      if (newValue != null && tabsListRef.current != null) {
        const selectedTabElement = getTabElement(newValue);

        if (selectedTabElement != null) {
          const { left, top } = getInset(selectedTabElement, tabsListRef.current);

          if (previousTabEdge.current == null) {
            previousTabEdge.current = orientation === 'horizontal' ? left : top;
            return 'none';
          }

          if (orientation === 'horizontal') {
            if (left < previousTabEdge.current) {
              previousTabEdge.current = left;
              return 'left';
            }
            if (left > previousTabEdge.current) {
              previousTabEdge.current = left;
              return 'right';
            }
          } else if (top < previousTabEdge.current) {
            previousTabEdge.current = top;
            return 'up';
          } else if (top > previousTabEdge.current) {
            previousTabEdge.current = top;
            return 'down';
          }
        }
      }

      return 'none';
    },
    [getTabElement, orientation, previousTabEdge, tabsListRef, selectedTabValue],
  );
}

export namespace TabsList {
  export interface State extends TabsRoot.State {}

  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * Whether to automatically change the active tab on arrow key focus.
     * Otherwise, tabs will be activated using Enter or Spacebar key press.
     * @default true
     */
    activateOnFocus?: boolean;
    /**
     * Whether to loop keyboard focus back to the first item
     * when the end of the list is reached while using the arrow keys.
     * @default true
     */
    loop?: boolean;
  }
}
