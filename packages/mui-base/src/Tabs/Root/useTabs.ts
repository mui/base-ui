'use client';
import * as React from 'react';
import type {
  TabActivationDirection,
  UseTabsParameters,
  UseTabsReturnValue,
} from './TabsRoot.types';
import type { TabPanelMetadata } from './TabsProvider';
import { useCompoundParent } from '../../useCompound';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useControlled } from '../../utils/useControlled';

export interface TabMetadata {
  disabled: boolean;
  id: string | undefined;
  ref: React.RefObject<HTMLElement>;
}

type IdLookupFunction = (id: any) => string | undefined;

/**
 *
 * Demos:
 *
 * - [Tabs](https://mui.com/base-ui/react-tabs/#hooks)
 *
 * API:
 *
 * - [useTabs API](https://mui.com/base-ui/react-tabs/hooks-api/#use-tabs)
 */
function useTabs(parameters: UseTabsParameters): UseTabsReturnValue {
  const {
    value: valueProp,
    defaultValue,
    onChange,
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
      onChange?.(event, newValue);
    },
    [onChange, setValue],
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

  const getRootProps: UseTabsReturnValue['getRootProps'] = React.useCallback(
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

export { useTabs };
