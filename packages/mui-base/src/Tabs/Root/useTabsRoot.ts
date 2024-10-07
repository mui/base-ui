'use client';
import * as React from 'react';
import type { TabActivationDirection } from './TabsRoot';
import type { TabsProviderValue, TabPanelMetadata } from './TabsProvider';
import { useCompoundParent } from '../../useCompound';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useControlled } from '../../utils/useControlled';

export interface TabMetadata {
  disabled: boolean;
  id: string | undefined;
  ref: React.RefObject<HTMLElement | null>;
}

type IdLookupFunction = (id: any) => string | undefined;

function useTabsRoot(parameters: useTabsRoot.Parameters): useTabsRoot.ReturnValue {
  const {
    value: valueProp,
    defaultValue,
    onValueChange,
    orientation = 'horizontal',
    direction = 'ltr',
  } = parameters;

  const [value, setValue] = useControlled({
    controlled: valueProp,
    default: defaultValue,
    name: 'Tabs',
    state: 'value',
  });

  const [tabActivationDirection, setTabActivationDirection] =
    React.useState<TabActivationDirection>('none');

  const onSelected = React.useCallback(
    (
      event: React.SyntheticEvent | null,
      newValue: any | null,
      activationDirection: TabActivationDirection,
    ) => {
      setValue(newValue);
      setTabActivationDirection(activationDirection);
      onValueChange?.(newValue, event);
    },
    [onValueChange, setValue],
  );

  const { subitems: tabPanels, contextValue: compoundComponentContextValue } = useCompoundParent<
    any,
    TabPanelMetadata
  >();

  const tabIdLookup = React.useRef<IdLookupFunction>(() => undefined);

  const getTabPanelId = React.useCallback(
    (tabValue: any) => {
      return tabPanels.get(tabValue)?.id;
    },
    [tabPanels],
  );

  const getTabId = React.useCallback((tabPanelId: any) => {
    return tabIdLookup.current(tabPanelId);
  }, []);

  const registerTabIdLookup = React.useCallback((lookupFunction: IdLookupFunction) => {
    tabIdLookup.current = lookupFunction;
  }, []);

  const getRootProps: useTabsRoot.ReturnValue['getRootProps'] = React.useCallback(
    (otherProps = {}) =>
      mergeReactProps<'div'>(otherProps, {
        dir: direction,
      }),
    [direction],
  );

  return {
    contextValue: {
      direction,
      getTabId,
      getTabPanelId,
      onSelected,
      orientation,
      registerTabIdLookup,
      value,
      tabActivationDirection,
      ...compoundComponentContextValue,
    },
    getRootProps,
    tabActivationDirection,
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
     * The component orientation (layout flow direction).
     * @default 'horizontal'
     */
    orientation?: 'horizontal' | 'vertical';
    /**
     * The direction of the text.
     * @default 'ltr'
     */
    direction?: 'ltr' | 'rtl';
    /**
     * Callback invoked when new value is being set.
     */
    onValueChange?: (value: any | null, event: React.SyntheticEvent | null) => void;
  }

  export interface ReturnValue {
    /**
     * Returns the values to be passed to the tabs provider.
     */
    contextValue: TabsProviderValue;
    getRootProps: (
      externalProps?: React.ComponentPropsWithRef<'div'>,
    ) => React.ComponentPropsWithRef<'div'>;
    tabActivationDirection: TabActivationDirection;
  }
}

export { useTabsRoot };
