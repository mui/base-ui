'use client';
import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useControlled } from '../../utils/useControlled';
import type { TabPanelMetadata } from '../TabPanel/useTabPanel';
import type { TabMetadata } from '../Tab/useTab';
import type { TabActivationDirection } from './TabsRoot';

type IdLookupFunction = (id: any) => string | undefined;

function useTabsRoot(parameters: useTabsRoot.Parameters): useTabsRoot.ReturnValue {
  const {
    value: valueProp,
    defaultValue,
    onValueChange: onValueChangeProp,
    direction = 'ltr',
  } = parameters;

  const tabPanelRefs = React.useRef<(HTMLElement | null)[]>([]);
  const getTabIdByPanelValueOrIndexRef = React.useRef<IdLookupFunction>(() => undefined);

  const [value, setValue] = useControlled({
    controlled: valueProp,
    default: defaultValue,
    name: 'Tabs',
    state: 'value',
  });

  const [tabPanelMap, setTabPanelMap] = React.useState(
    () => new Map<Node, (TabPanelMetadata & { index?: number | null }) | null>(),
  );
  const [tabMap, setTabMap] = React.useState(
    () => new Map<Node, (TabMetadata & { index?: number | null }) | null>(),
  );

  const [tabActivationDirection, setTabActivationDirection] =
    React.useState<TabActivationDirection>('none');

  const onValueChange = React.useCallback(
    (
      newValue: any | null,
      activationDirection: TabActivationDirection,
      event: Event | undefined,
    ) => {
      setValue(newValue);
      setTabActivationDirection(activationDirection);
      onValueChangeProp?.(newValue, event);
    },
    [onValueChangeProp, setValue],
  );

  // get the `id` attribute of <Tabs.Panel> to set as the value of `aria-controls` on <Tabs.Tab>
  const getTabPanelIdByTabValueOrIndex = React.useCallback(
    (tabValue: any | undefined, index: number) => {
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
    (tabPanelValue: any | undefined, index: number) => {
      if (tabPanelValue === undefined && index < 0) {
        return undefined;
      }

      for (const tabMetadata of tabMap.values()) {
        // console.log(tabPanelValue, index, tabMetadata);

        // find by tabPanelValue
        if (
          tabPanelValue !== undefined &&
          index > -1 &&
          tabPanelValue === (tabMetadata?.value ?? tabMetadata?.index ?? undefined)
        ) {
          // console.log('found by tabPanelValue', tabMetadata?.id);
          return tabMetadata?.id;
        }

        // find by index
        if (
          tabPanelValue === undefined &&
          index > -1 &&
          index === (tabMetadata?.value ?? tabMetadata?.index ?? undefined)
        ) {
          // console.log('found by tabPanel index', tabMetadata?.id);
          return tabMetadata?.id;
        }
      }

      return undefined;
    },
    [tabMap],
  );

  // FIXME
  // used as a param for `useActivationDirectionDetector`
  // put this into TabsRootContext
  // use it in useTabsList
  const getTabElementBySelectedValue = React.useCallback((selectedValue: any | undefined) => {
    console.log('getTabElementBySelectedValue', selectedValue);
    return null;
  }, []);

  // TODO: no need to put this in a ref anymore?
  const registerGetTabIdByPanelValueOrIndexFn = React.useCallback(
    (lookupFunction: IdLookupFunction) => {
      getTabIdByPanelValueOrIndexRef.current = lookupFunction;
    },
    [],
  );

  const getRootProps: useTabsRoot.ReturnValue['getRootProps'] = React.useCallback(
    (otherProps = {}) =>
      mergeReactProps<'div'>(otherProps, {
        dir: direction,
      }),
    [direction],
  );

  return {
    getRootProps,
    direction,
    getTabElementBySelectedValue,
    getTabIdByPanelValueOrIndex,
    getTabPanelIdByTabValueOrIndex,
    onValueChange,
    registerGetTabIdByPanelValueOrIndexFn,
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
    value?: any | null;
    /**
     * The default value. Use when the component is not controlled.
     */
    defaultValue?: any | null;
    /**
     * The direction of the text.
     * @default 'ltr'
     */
    direction?: 'ltr' | 'rtl';
    /**
     * Callback invoked when new value is being set.
     */
    onValueChange?: (value: any | null, event?: Event) => void;
  }

  export interface ReturnValue {
    getRootProps: (
      externalProps?: React.ComponentPropsWithRef<'div'>,
    ) => React.ComponentPropsWithRef<'div'>;
    /**
     * The direction of the text.
     */
    direction: 'ltr' | 'rtl';
    /**
     * Gets the underlying element of the Tab with the given value.
     * @param value Value to find the tab for.
     */
    getTabElementBySelectedValue: (panelValue: any | undefined) => HTMLElement | null;
    /**
     * Gets the `id` attribute of the Tab with the given value.
     * @param (any | undefined) panelValue Value to find the Tab for.
     * @param (number) index The index of the Tab to look for.
     */
    getTabIdByPanelValueOrIndex: (panelValue: any | undefined, index: number) => string | undefined;
    /**
     * Gets the id of the tab panel with the given value.
     * @param value Value to find the tab panel for.
     */
    getTabPanelIdByTabValueOrIndex: (
      tabValue: any | undefined,
      index: number,
    ) => string | undefined;
    /**
     * Callback for setting new value.
     */
    onValueChange: (
      value: any | null,
      activationDirection: TabActivationDirection,
      event: Event,
    ) => void;
    /**
     * Registers a function that returns the id of the tab with the given value.
     */
    registerGetTabIdByPanelValueOrIndexFn: (
      lookupFunction: (id: any) => string | undefined,
    ) => void;
    setTabMap: (map: Map<Node, (TabMetadata & { index?: number | null }) | null>) => void;
    setTabPanelMap: (map: Map<Node, (TabPanelMetadata & { index?: number | null }) | null>) => void;
    /**
     * The position of the active tab relative to the previously active tab.
     */
    tabActivationDirection: TabActivationDirection;
    tabMap: Map<Node, (TabMetadata & { index?: number | null }) | null>;
    tabPanelRefs: React.RefObject<(HTMLElement | null)[]>;
    /**
     * The currently selected tab's value.
     */
    value: any | null;
  }
}

export { useTabsRoot, TabMetadata };
