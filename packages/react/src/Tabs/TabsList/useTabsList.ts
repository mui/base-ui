'use client';
import * as React from 'react';
import type { TabsRootContext } from '../Root/TabsRootContext';
import { type TabsOrientation, type TabActivationDirection } from '../Root/TabsRoot';
import { useForkRef } from '../../utils/useForkRef';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { useEventCallback } from '../../utils/useEventCallback';
// import { TabsListContext } from './TabsListContext';

function useTabsList(parameters: useTabsList.Parameters): useTabsList.ReturnValue {
  const {
    onValueChange,
    orientation,
    // registerGetTabIdByPanelValueOrIndexFn,
    rootRef: externalRef,
    tabsListRef,
    value: selectedTabValue,
  } = parameters;

  // subitems are <Tab>s, their Composite parent is <Tabs.List>
  // const { subitems } = useCompoundParent<any, TabMetadata>();

  // DON"T NEED THIS ANYMORE
  //
  // get id attribute of a Tab by tab value
  // for binding aria attributes
  // this function needs to be registered to the context
  //
  // const tabIdLookup = React.useCallback(
  //   (tabValue: any) => {
  //     return subitems.get(tabValue)?.id;
  //   },
  //   [subitems],
  // );

  // registerGetTabIdByPanelValueOrIndexFn(tabIdLookup);

  // this is a param for useList
  // const subitemKeys = React.useMemo(() => Array.from(subitems.keys()), [subitems]);

  // get the element/node of a tab by tab value
  // used as a param for `useActivationDirectionDetector`
  // TODO: move this to useTabsRoot since tabMap is there
  const getTabElement = React.useCallback(
    (tabValue: any) => {
      if (tabValue == null) {
        return null;
      }

      // subitems are <Tab>s, their Composite parent is <Tabs.List>
      // return subitems.get(tabValue)?.ref.current ?? null;
      return null;
    },
    [
      /* subitems */
    ],
  );

  // let listOrientation: UseListParameters<any, any>['orientation'];
  // if (orientation === 'vertical') {
  //   listOrientation = 'vertical';
  // } else {
  //   listOrientation = direction === 'rtl' ? 'horizontal-rtl' : 'horizontal-ltr';
  // }

  // const tabsListRef = React.useRef<HTMLElement>(null);
  const detectActivationDirection = useActivationDirectionDetector(
    selectedTabValue,
    orientation,
    tabsListRef,
    getTabElement,
  );

  const onTabActivation = useEventCallback((newValue: any, event: Event) => {
    // console.log('onTabActivation()', newValue, event.target);
    if (newValue !== selectedTabValue) {
      const activationDirection = detectActivationDirection(newValue);
      onValueChange(newValue, activationDirection, event);
    }
  });

  // const controlledProps = React.useMemo(() => {
  //   return value != null ? { selectedValues: [value] } : { selectedValues: [] };
  // }, [value]);

  // const isItemDisabled = React.useCallback(
  //   (item: any) => subitems.get(item)?.disabled ?? false,
  //   [subitems],
  // );

  // React.useEffect(() => {
  //   if (value === undefined) {
  //     return;
  //   }

  //   // when a value changes externally, the highlighted value should be synced to it
  //   if (value != null) {
  //     dispatch({
  //       type: TabsListActionTypes.valueChange,
  //       value,
  //     });
  //   }
  // }, [dispatch, value]);

  const handleRef = useForkRef(tabsListRef, externalRef);

  const getRootProps = (
    externalProps: React.ComponentPropsWithoutRef<'div'> = {},
  ): React.ComponentPropsWithRef<'div'> => {
    return mergeReactProps(externalProps, {
      'aria-orientation': orientation === 'vertical' ? 'vertical' : undefined,
      ref: handleRef,
      role: 'tablist',
    });
  };

  return {
    getRootProps,
    onTabActivation,
    rootRef: handleRef,
    tabsListRef,
  };
}

function getInset(tab: HTMLElement, tabsList: HTMLElement) {
  const { left: tabLeft, top: tabTop } = tab.getBoundingClientRect();
  const { left: listLeft, top: listTop } = tabsList.getBoundingClientRect();

  const left = tabLeft - listLeft;
  const top = tabTop - listTop;

  return { left, top };
}

function useActivationDirectionDetector(
  value: any,
  orientation: TabsOrientation,
  tabsListRef: React.RefObject<HTMLElement | null>,
  getTabElement: (tabValue: any) => HTMLElement | null,
): (newValue: any) => TabActivationDirection {
  const previousTabEdge = React.useRef<number | null>(null);

  useEnhancedEffect(() => {
    // Whenever orientation changes, reset the state.
    if (value == null || tabsListRef.current == null) {
      previousTabEdge.current = null;
      return;
    }

    const activeTab = getTabElement(value);
    if (activeTab == null) {
      previousTabEdge.current = null;
      return;
    }

    const { left, top } = getInset(activeTab, tabsListRef.current);
    previousTabEdge.current = orientation === 'horizontal' ? left : top;
  }, [orientation, getTabElement, tabsListRef, value]);

  return React.useCallback(
    (newValue: any) => {
      if (newValue === value) {
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
    [getTabElement, orientation, previousTabEdge, tabsListRef, value],
  );
}

namespace useTabsList {
  export interface Parameters
    extends Pick<TabsRootContext, 'onValueChange' | 'orientation' | 'setTabMap' | 'value'> {
    /**
     * Ref to the root element.
     */
    rootRef: React.Ref<Element>;
    tabsListRef: React.RefObject<HTMLElement | null>;
  }

  export interface ReturnValue {
    /**
     * Resolver for the root slot's props.
     * @param externalProps props for the root slot
     * @returns props that should be spread on the root slot
     */
    getRootProps: (
      externalProps?: React.ComponentPropsWithRef<'div'>,
    ) => React.ComponentPropsWithRef<'div'>;
    /**
     * Callback when a Tab is activated
     * @param {any | null} newValue The value of the newly activated tab.
     * @param {Event} event The event that activated the Tab.
     */
    onTabActivation: (newValue: any, event: Event) => void;
    rootRef: React.RefCallback<Element> | null;
    tabsListRef: React.RefObject<HTMLElement | null>;
  }
}

export { useTabsList };
