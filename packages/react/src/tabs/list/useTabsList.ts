'use client';
import * as React from 'react';
import type { TabsRootContext } from '../root/TabsRootContext';
import { type TabsOrientation, type TabActivationDirection } from '../root/TabsRoot';
import { mergeProps } from '../../merge-props';
import { GenericHTMLProps } from '../../utils/types';
import { useModernLayoutEffect } from '../../utils/useModernLayoutEffect';
import { useForkRef } from '../../utils/useForkRef';
import { useEventCallback } from '../../utils/useEventCallback';

export function useTabsList(parameters: useTabsList.Parameters): useTabsList.ReturnValue {
  const {
    getTabElementBySelectedValue,
    onValueChange,
    orientation,
    rootRef: externalRef,
    tabsListRef,
    value: selectedTabValue,
  } = parameters;

  const detectActivationDirection = useActivationDirectionDetector(
    // the old value
    selectedTabValue,
    orientation,
    tabsListRef,
    getTabElementBySelectedValue,
  );

  const onTabActivation = useEventCallback((newValue: any, event: Event) => {
    if (newValue !== selectedTabValue) {
      const activationDirection = detectActivationDirection(newValue);
      onValueChange(newValue, activationDirection, event);
    }
  });

  const handleRef = useForkRef(tabsListRef, externalRef);

  const getRootProps = React.useCallback(
    (otherProps = {}): React.ComponentPropsWithRef<'div'> => {
      return mergeProps(
        {
          'aria-orientation': orientation === 'vertical' ? 'vertical' : undefined,
          ref: handleRef,
          role: 'tablist',
        },
        otherProps,
      );
    },
    [handleRef, orientation],
  );

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
  // the old value
  selectedTabValue: any,
  orientation: TabsOrientation,
  tabsListRef: React.RefObject<HTMLElement | null>,
  getTabElement: (selectedValue: any) => HTMLElement | null,
): (newValue: any) => TabActivationDirection {
  const previousTabEdge = React.useRef<number | null>(null);

  useModernLayoutEffect(() => {
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

export namespace useTabsList {
  export interface Parameters
    extends Pick<
      TabsRootContext,
      'getTabElementBySelectedValue' | 'onValueChange' | 'orientation' | 'setTabMap' | 'value'
    > {
    /**
     * Ref to the root element.
     */
    rootRef: React.Ref<Element>;
    tabsListRef: React.RefObject<HTMLElement | null>;
  }

  export interface ReturnValue {
    /**
     * Resolver for the TabsList component's props.
     * @param externalProps additional props for Tabs.TabsList
     * @returns props that should be spread on Tabs.TabsList
     */
    getRootProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
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
