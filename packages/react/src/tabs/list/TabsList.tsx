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
    setTabActivationDirection,
    value,
    setTabMap,
    tabActivationDirection,
  } = useTabsRootContext();

  const [highlightedTabIndex, setHighlightedTabIndex] = React.useState(0);

  const [tabsListElement, setTabsListElement] = React.useState<HTMLElement | null>(null);

  const detectActivationDirection = useActivationDirectionDetector(
    value, // the old value
    orientation,
    tabsListElement,
    getTabElementBySelectedValue,
    setTabActivationDirection,
  );

  const onTabActivation = useStableCallback(
    (newValue: TabsTab.Value, eventDetails: TabsRoot.ChangeEventDetails) => {
      if (newValue !== value) {
        const activationDirection = detectActivationDirection(newValue, false);
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

function getInset(tab: HTMLElement, tabsList: HTMLElement) {
  const { left: tabLeft, top: tabTop } = tab.getBoundingClientRect();
  const { left: listLeft, top: listTop } = tabsList.getBoundingClientRect();

  const left = tabLeft - listLeft;
  const top = tabTop - listTop;

  return { left, top };
}

function useActivationDirectionDetector(
  // the current value (will be the old value when newValue is passed to the returned function)
  activeTabValue: any,
  orientation: TabsRoot.Orientation,
  tabsListElement: HTMLElement | null,
  getTabElement: (selectedValue: any) => HTMLElement | null,
  setTabActivationDirection: React.Dispatch<React.SetStateAction<TabsTab.ActivationDirection>>,
): (newValue: any, isExternalChange: boolean) => TabsTab.ActivationDirection {
  const previousTabEdgeRef = React.useRef<number | null>(null);
  // Track the value that was last processed by the callback (internal change)
  // to avoid double-processing when the effect runs after
  const valueHandledByCallbackRef = React.useRef<any>(undefined);

  // Calculate direction based on comparing new tab edge with previous
  const calculateDirection = React.useCallback(
    (newTabEdge: number): TabsTab.ActivationDirection => {
      const previousEdge = previousTabEdgeRef.current;

      if (previousEdge == null) {
        return 'none';
      }

      if (orientation === 'horizontal') {
        if (newTabEdge < previousEdge) {
          return 'left';
        }
        if (newTabEdge > previousEdge) {
          return 'right';
        }
      } else {
        if (newTabEdge < previousEdge) {
          return 'up';
        }
        if (newTabEdge > previousEdge) {
          return 'down';
        }
      }

      return 'none';
    },
    [orientation],
  );

  // Track the active tab's edge position and detect external value changes
  useIsoLayoutEffect(() => {
    if (activeTabValue == null || tabsListElement == null) {
      previousTabEdgeRef.current = null;
      return;
    }

    const activeTab = getTabElement(activeTabValue);
    if (activeTab == null) {
      previousTabEdgeRef.current = null;
      return;
    }

    const { left, top } = getInset(activeTab, tabsListElement);
    const newTabEdge = orientation === 'horizontal' ? left : top;

    // If this value was already handled by the callback (internal click),
    // just update the edge without calculating direction
    if (activeTabValue === valueHandledByCallbackRef.current) {
      previousTabEdgeRef.current = newTabEdge;
      valueHandledByCallbackRef.current = undefined;
      return;
    }

    // External change: calculate and set direction if we have a previous edge
    if (previousTabEdgeRef.current != null) {
      const direction = calculateDirection(newTabEdge);
      setTabActivationDirection(direction);
    }

    previousTabEdgeRef.current = newTabEdge;
  }, [
    orientation,
    getTabElement,
    tabsListElement,
    activeTabValue,
    calculateDirection,
    setTabActivationDirection,
  ]);

  return React.useCallback(
    (newValue: any, _isExternalChange: boolean) => {
      if (newValue === activeTabValue) {
        return 'none';
      }

      if (newValue == null) {
        previousTabEdgeRef.current = null;
        return 'none';
      }

      if (newValue != null && tabsListElement != null) {
        const activeTabElement = getTabElement(newValue);

        if (activeTabElement != null) {
          const { left, top } = getInset(activeTabElement, tabsListElement);
          const newTabEdge = orientation === 'horizontal' ? left : top;

          if (previousTabEdgeRef.current == null) {
            previousTabEdgeRef.current = newTabEdge;
            // Mark as handled so the effect doesn't double-process
            valueHandledByCallbackRef.current = newValue;
            return 'none';
          }

          const direction = calculateDirection(newTabEdge);

          // Update the edge for future comparisons
          previousTabEdgeRef.current = newTabEdge;
          // Mark as handled so the effect doesn't double-process
          valueHandledByCallbackRef.current = newValue;

          return direction;
        }
      }

      return 'none';
    },
    [getTabElement, orientation, tabsListElement, activeTabValue, calculateDirection],
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
