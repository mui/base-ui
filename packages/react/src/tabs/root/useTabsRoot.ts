'use client';
import * as React from 'react';
import { useControlled } from '../../utils/useControlled';
import type { CompositeMetadata } from '../../composite/list/CompositeList';
import type { TabPanelMetadata } from '../panel/useTabsPanel';
import type { TabMetadata } from '../tab/useTabsTab';
import type { TabActivationDirection, TabValue } from './TabsRoot';

function useTabsRoot(parameters: useTabsRoot.Parameters): useTabsRoot.ReturnValue {
  const { value: valueProp, defaultValue, onValueChange: onValueChangeProp } = parameters;

  const tabPanelRefs = React.useRef<(HTMLElement | null)[]>([]);

  const [value, setValue] = useControlled({
    controlled: valueProp,
    default: defaultValue,
    name: 'Tabs',
    state: 'value',
  });

  const [tabPanelMap, setTabPanelMap] = React.useState(
    () => new Map<Node, CompositeMetadata<TabPanelMetadata> | null>(),
  );
  const [tabMap, setTabMap] = React.useState(
    () => new Map<Node, CompositeMetadata<TabMetadata> | null>(),
  );

  const [tabActivationDirection, setTabActivationDirection] =
    React.useState<TabActivationDirection>('none');

  const onValueChange = React.useCallback(
    (newValue: TabValue, activationDirection: TabActivationDirection, event: Event | undefined) => {
      setValue(newValue);
      setTabActivationDirection(activationDirection);
      onValueChangeProp?.(newValue, event);
    },
    [onValueChangeProp, setValue],
  );

  // get the `id` attribute of <Tabs.Panel> to set as the value of `aria-controls` on <Tabs.Tab>
  const getTabPanelIdByTabValueOrIndex = React.useCallback(
    (tabValue: TabValue | undefined, index: number) => {
      if (tabValue === undefined && index < 0) {
        return undefined;
      }

      for (const tabPanelMetadata of tabPanelMap.values()) {
        // find by tabValue
        if (tabValue !== undefined && tabPanelMetadata && tabValue === tabPanelMetadata?.value) {
          return tabPanelMetadata.id;
        }

        // find by index
        if (
          tabValue === undefined &&
          tabPanelMetadata?.index &&
          tabPanelMetadata?.index === index
        ) {
          return tabPanelMetadata.id;
        }
      }

      return undefined;
    },
    [tabPanelMap],
  );

  // get the `id` attribute of <Tabs.Tab> to set as the value of `aria-labelledby` on <Tabs.Panel>
  const getTabIdByPanelValueOrIndex = React.useCallback(
    (tabPanelValue: TabValue | undefined, index: number) => {
      if (tabPanelValue === undefined && index < 0) {
        return undefined;
      }

      for (const tabMetadata of tabMap.values()) {
        // find by tabPanelValue
        if (
          tabPanelValue !== undefined &&
          index > -1 &&
          tabPanelValue === (tabMetadata?.value ?? tabMetadata?.index ?? undefined)
        ) {
          return tabMetadata?.id;
        }

        // find by index
        if (
          tabPanelValue === undefined &&
          index > -1 &&
          index === (tabMetadata?.value ?? tabMetadata?.index ?? undefined)
        ) {
          return tabMetadata?.id;
        }
      }

      return undefined;
    },
    [tabMap],
  );

  // used in `useActivationDirectionDetector` for setting data-activation-direction
  const getTabElementBySelectedValue = React.useCallback(
    (selectedValue: TabValue | undefined): HTMLElement | null => {
      if (selectedValue === undefined) {
        return null;
      }

      for (const [tabElement, tabMetadata] of tabMap.entries()) {
        if (tabMetadata != null && selectedValue === (tabMetadata.value ?? tabMetadata.index)) {
          return tabElement as HTMLElement;
        }
      }

      return null;
    },
    [tabMap],
  );

  return {
    getTabElementBySelectedValue,
    getTabIdByPanelValueOrIndex,
    getTabPanelIdByTabValueOrIndex,
    onValueChange,
    setTabMap,
    setTabPanelMap,
    tabActivationDirection,
    tabMap,
    tabPanelRefs,
    value,
  };
}

namespace useTabsRoot {
  export interface Parameters {
    /**
     * The value of the currently selected `Tab`.
     * If you don't want any selected `Tab`, you can set this prop to `false`.
     */
    value?: TabValue;
    /**
     * The default value. Use when the component is not controlled.
     */
    defaultValue?: TabValue;
    /**
     * Callback invoked when new value is being set.
     */
    onValueChange?: (value: TabValue, event?: Event) => void;
  }

  export interface ReturnValue {
    /**
     * Gets the element of the Tab with the given value.
     * @param {any | undefined} value Value to find the tab for.
     */
    getTabElementBySelectedValue: (panelValue: TabValue | undefined) => HTMLElement | null;
    /**
     * Gets the `id` attribute of the Tab that corresponds to the given TabPanel value or index.
     * @param (any | undefined) panelValue Value to find the Tab for.
     * @param (number) index The index of the Tab to look for.
     */
    getTabIdByPanelValueOrIndex: (
      panelValue: TabValue | undefined,
      index: number,
    ) => string | undefined;
    /**
     * Gets the `id` attribute of the TabPanel that corresponds to the given Tab value or index.
     * @param value Value to find the tab panel for.
     */
    getTabPanelIdByTabValueOrIndex: (
      tabValue: TabValue | undefined,
      index: number,
    ) => string | undefined;
    /**
     * Callback for setting new value.
     */
    onValueChange: (
      value: TabValue,
      activationDirection: TabActivationDirection,
      event: Event,
    ) => void;
    setTabMap: (map: Map<Node, CompositeMetadata<TabMetadata> | null>) => void;
    setTabPanelMap: (map: Map<Node, CompositeMetadata<TabPanelMetadata> | null>) => void;
    /**
     * The position of the active tab relative to the previously active tab.
     */
    tabActivationDirection: TabActivationDirection;
    tabMap: Map<Node, CompositeMetadata<TabMetadata> | null>;
    tabPanelRefs: React.RefObject<(HTMLElement | null)[]>;
    /**
     * The currently selected tab's value.
     */
    value: TabValue;
  }
}

export { useTabsRoot, TabMetadata };
