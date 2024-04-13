'use client';
import * as React from 'react';
import { useTabsContext } from '../useTabs/TabsContext';
import {
  TabsListActionTypes,
  type UseTabsListParameters,
  type UseTabsListReturnValue,
  type ValueChangeAction,
} from './useTabsList.types';
import { useCompoundParent } from '../useCompound';
import { type TabMetadata } from '../useTabs/useTabs';
import { useList, ListState, UseListParameters } from '../useList';
import { tabsListReducer } from './tabsListReducer';
import { useForkRef } from '../utils/useForkRef';
import { mergeReactProps } from '../utils/mergeReactProps';

/**
 *
 * Demos:
 *
 * - [Tabs](https://mui.com/base-ui/react-tabs/#hooks)
 *
 * API:
 *
 * - [useTabsList API](https://mui.com/base-ui/react-tabs/hooks-api/#use-tabs-list)
 */
function useTabsList(parameters: UseTabsListParameters): UseTabsListReturnValue {
  const { rootRef: externalRef, loop, activateOnFocus } = parameters;

  const {
    direction = 'ltr',
    onSelected,
    orientation = 'horizontal',
    value,
    registerTabIdLookup,
  } = useTabsContext();

  const { subitems, contextValue: compoundComponentContextValue } = useCompoundParent<
    string | number,
    TabMetadata
  >();

  const tabIdLookup = React.useCallback(
    (tabValue: string | number) => {
      return subitems.get(tabValue)?.id;
    },
    [subitems],
  );

  registerTabIdLookup(tabIdLookup);

  const subitemKeys = React.useMemo(() => Array.from(subitems.keys()), [subitems]);

  const getTabElement = React.useCallback(
    (tabValue: string | number) => {
      if (tabValue == null) {
        return null;
      }

      return subitems.get(tabValue)?.ref.current ?? null;
    },
    [subitems],
  );

  let listOrientation: UseListParameters<any, any>['orientation'];
  if (orientation === 'vertical') {
    listOrientation = 'vertical';
  } else {
    listOrientation = direction === 'rtl' ? 'horizontal-rtl' : 'horizontal-ltr';
  }

  const handleChange = React.useCallback(
    (
      event:
        | React.FocusEvent<Element, Element>
        | React.KeyboardEvent<Element>
        | React.MouseEvent<Element, MouseEvent>
        | null,
      newValue: (string | number)[],
    ) => {
      onSelected(event, newValue[0] ?? null);
    },
    [onSelected],
  );

  const controlledProps = React.useMemo(() => {
    return value != null ? { selectedValues: [value] } : { selectedValues: [] };
  }, [value]);

  const isItemDisabled = React.useCallback(
    (item: string | number) => subitems.get(item)?.disabled ?? false,
    [subitems],
  );

  const {
    contextValue: listContextValue,
    dispatch,
    getRootProps: getListboxRootProps,
    state: { highlightedValue, selectedValues },
    rootRef: mergedRootRef,
  } = useList<
    string | number,
    ListState<string | number>,
    ValueChangeAction,
    { activateOnFocus: boolean }
  >({
    controlledProps,
    disabledItemsFocusable: !activateOnFocus,
    focusManagement: 'DOM',
    getItemDomElement: getTabElement,
    isItemDisabled,
    items: subitemKeys,
    rootRef: externalRef,
    onChange: handleChange,
    orientation: listOrientation,
    reducerActionContext: React.useMemo(() => ({ activateOnFocus }), [activateOnFocus]),
    selectionMode: 'single',
    stateReducer: tabsListReducer,
    disableListWrap: !loop,
  });

  React.useEffect(() => {
    if (value === undefined) {
      return;
    }

    // when a value changes externally, the highlighted value should be synced to it
    if (value != null) {
      dispatch({
        type: TabsListActionTypes.valueChange,
        value,
      });
    }
  }, [dispatch, value]);

  const tabsListRef = React.useRef<HTMLElement | null>(null);
  const handleRef = useForkRef(mergedRootRef, tabsListRef);

  const getRootProps = (
    externalProps: React.ComponentPropsWithoutRef<'div'> = {},
  ): React.ComponentPropsWithRef<'div'> => {
    return mergeReactProps(
      externalProps,
      mergeReactProps(
        {
          'aria-orientation': orientation === 'vertical' ? 'vertical' : undefined,
          role: 'tablist',
          ref: handleRef,
        },
        getListboxRootProps(),
      ),
    );
  };

  const contextValue = React.useMemo(
    () => ({
      ...compoundComponentContextValue,
      ...listContextValue,
      activateOnFocus,
      getTabElement,
      value,
      tabsListRef,
    }),
    [
      compoundComponentContextValue,
      listContextValue,
      activateOnFocus,
      getTabElement,
      value,
      tabsListRef,
    ],
  );

  return {
    contextValue,
    dispatch,
    getRootProps,
    highlightedValue,
    direction,
    orientation,
    rootRef: handleRef,
    selectedValue: selectedValues[0] ?? null,
  };
}

export { useTabsList };
