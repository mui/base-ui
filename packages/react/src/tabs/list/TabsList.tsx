'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
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
    value,
    setTabMap,
    tabActivationDirection,
  } = useTabsRootContext();

  const [highlightedTabIndex, setHighlightedTabIndex] = React.useState(0);
  const [tabsListElement, setTabsListElement] = React.useState<HTMLElement | null>(null);

  const indicatorUpdateListenersRef = React.useRef(new Set<() => void>());
  const tabResizeObserverElementsRef = React.useRef(new Set<HTMLElement>());
  const resizeObserverRef = React.useRef<ResizeObserver | null>(null);

  const notifyIndicatorUpdateListeners = useStableCallback(() => {
    indicatorUpdateListenersRef.current.forEach((listener) => {
      listener();
    });
  });

  React.useEffect(() => {
    if (typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const resizeObserver = new ResizeObserver(() => {
      if (!indicatorUpdateListenersRef.current.size) {
        return;
      }
      notifyIndicatorUpdateListeners();
    });

    resizeObserverRef.current = resizeObserver;

    if (tabsListElement) {
      resizeObserver.observe(tabsListElement);
    }

    tabResizeObserverElementsRef.current.forEach((element) => {
      resizeObserver.observe(element);
    });

    return () => {
      resizeObserver.disconnect();
      resizeObserverRef.current = null;
    };
  }, [tabsListElement, notifyIndicatorUpdateListeners]);

  const registerIndicatorUpdateListener = useStableCallback((listener: () => void) => {
    indicatorUpdateListenersRef.current.add(listener);
    return () => {
      indicatorUpdateListenersRef.current.delete(listener);
    };
  });

  const registerTabResizeObserverElement = useStableCallback((element: HTMLElement) => {
    tabResizeObserverElementsRef.current.add(element);
    resizeObserverRef.current?.observe(element);
    return () => {
      tabResizeObserverElementsRef.current.delete(element);
      resizeObserverRef.current?.unobserve(element);
    };
  });

  const detectActivationDirection = useActivationDirectionDetector(
    value, // the old value
    orientation,
    tabsListElement,
    getTabElementBySelectedValue,
  );

  const onTabActivation = useStableCallback(
    (newValue: TabsTab.Value, eventDetails: TabsRoot.ChangeEventDetails) => {
      if (newValue !== value) {
        const activationDirection = detectActivationDirection(newValue);
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
      registerIndicatorUpdateListener,
      registerTabResizeObserverElement,
      onTabActivation,
      setHighlightedTabIndex,
      tabsListElement,
    }),
    [
      activateOnFocus,
      highlightedTabIndex,
      registerIndicatorUpdateListener,
      registerTabResizeObserverElement,
      onTabActivation,
      setHighlightedTabIndex,
      tabsListElement,
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

function getInset(tab: HTMLElement, tabsList: HTMLElement) {
  const { left: tabLeft, top: tabTop } = tab.getBoundingClientRect();
  const { left: listLeft, top: listTop } = tabsList.getBoundingClientRect();

  const left = tabLeft - listLeft;
  const top = tabTop - listTop;

  return { left, top };
}

function useActivationDirectionDetector(
  // the old value
  activeTabValue: any,
  orientation: TabsRoot.Orientation,
  tabsListElement: HTMLElement | null,
  getTabElement: (selectedValue: any) => HTMLElement | null,
): (newValue: any) => TabsTab.ActivationDirection {
  const [previousTabEdge, setPreviousTabEdge] = React.useState<number | null>(null);

  useIsoLayoutEffect(() => {
    // Whenever orientation changes, reset the state.
    if (activeTabValue == null || tabsListElement == null) {
      setPreviousTabEdge(null);
      return;
    }

    const activeTab = getTabElement(activeTabValue);
    if (activeTab == null) {
      setPreviousTabEdge(null);
      return;
    }

    const { left, top } = getInset(activeTab, tabsListElement);
    setPreviousTabEdge(orientation === 'horizontal' ? left : top);
  }, [orientation, getTabElement, tabsListElement, activeTabValue]);

  return React.useCallback(
    (newValue: any) => {
      if (newValue === activeTabValue) {
        return 'none';
      }

      if (newValue == null) {
        setPreviousTabEdge(null);
        return 'none';
      }

      if (newValue != null && tabsListElement != null) {
        const activeTabElement = getTabElement(newValue);

        if (activeTabElement != null) {
          const { left, top } = getInset(activeTabElement, tabsListElement);

          if (previousTabEdge == null) {
            setPreviousTabEdge(orientation === 'horizontal' ? left : top);
            return 'none';
          }

          if (orientation === 'horizontal') {
            if (left < previousTabEdge) {
              setPreviousTabEdge(left);
              return 'left';
            }
            if (left > previousTabEdge) {
              setPreviousTabEdge(left);
              return 'right';
            }
          } else if (top < previousTabEdge) {
            setPreviousTabEdge(top);
            return 'up';
          } else if (top > previousTabEdge) {
            setPreviousTabEdge(top);
            return 'down';
          }
        }
      }

      return 'none';
    },
    [getTabElement, orientation, previousTabEdge, tabsListElement, activeTabValue],
  );
}

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
