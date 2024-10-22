'use client';
import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useControlled } from '../../utils/useControlled';
import type { TabPanelMetadata } from '../TabPanel/useTabPanel';
import type { TabActivationDirection } from './TabsRoot';

export interface TabMetadata {
  disabled: boolean;
  id: string | undefined;
  ref: React.RefObject<HTMLElement | null>;
}

type IdLookupFunction = (id: any) => string | undefined;

function useTabsRoot(parameters: useTabsRoot.Parameters): useTabsRoot.ReturnValue {
  const { value: valueProp, defaultValue, onValueChange, direction = 'ltr' } = parameters;

  const tabPanelRefs = React.useRef<(HTMLElement | null)[]>([]);
  const getTabIdByPanelValueRef = React.useRef<IdLookupFunction>(() => undefined);

  const [value, setValue] = useControlled({
    controlled: valueProp,
    default: defaultValue,
    name: 'Tabs',
    state: 'value',
  });

  const [tabPanelMap, setTabPanelMap] = React.useState(
    () => new Map<Node, (TabPanelMetadata & { index?: number | null }) | null>(),
  );

  const [tabActivationDirection, setTabActivationDirection] =
    React.useState<TabActivationDirection>('none');

  const onSelected = React.useCallback(
    (
      event: Event | undefined,
      newValue: any | null,
      activationDirection: TabActivationDirection,
    ) => {
      setValue(newValue);
      setTabActivationDirection(activationDirection);
      onValueChange?.(newValue, event ?? undefined);
    },
    [onValueChange, setValue],
  );

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

  const getTabIdByPanelValue = React.useCallback((tabPanelValue: any) => {
    return getTabIdByPanelValueRef.current(tabPanelValue);
  }, []);

  const registerTabIdLookup = React.useCallback((lookupFunction: IdLookupFunction) => {
    getTabIdByPanelValueRef.current = lookupFunction;
  }, []);

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
    getTabId: getTabIdByPanelValue,
    getTabPanelIdByTabValueOrIndex,
    onSelected,
    registerTabIdLookup,
    setTabPanelMap,
    tabActivationDirection,
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
     * Gets the id of the tab with the given value.
     * @param value Value to find the tab for.
     */
    getTabId: (value: any) => string | undefined;
    /**
     * Gets the id of the tab panel with the given value.
     * @param value Value to find the tab panel for.
     */
    getTabPanelIdByTabValueOrIndex: (
      tabValue: any | undefined,
      tabIndex: number,
    ) => string | undefined;

    /**
     * Callback for setting new value.
     */
    onSelected: (
      event: React.SyntheticEvent | null,
      value: any | null,
      activationDirection: TabActivationDirection,
    ) => void;
    /**
     * Registers a function that returns the id of the tab with the given value.
     */
    registerTabIdLookup: (lookupFunction: (id: any) => string | undefined) => void;
    setTabPanelMap: (map: Map<Node, (TabPanelMetadata & { index?: number | null }) | null>) => void;
    /**
     * The position of the active tab relative to the previously active tab.
     */
    tabActivationDirection: TabActivationDirection;
    tabPanelRefs: React.RefObject<(HTMLElement | null)[]>;
    /**
     * The currently selected tab's value.
     */
    value: any | null;
  }
}

export { useTabsRoot };
