'use client';
import * as React from 'react';
import {
  TabsListActionTypes,
  type UseTabsListParameters,
  type UseTabsListReturnValue,
} from './TabsList.types';
import { TabsReducerState, tabsListReducer } from './tabsListReducer';
import { useTabsContext } from '../Root/TabsContext';
import { type TabMetadata } from '../Tab/Tab.types';
import { type TabsOrientation, type TabActivationDirection } from '../Root/TabsRoot.types';
import { useCompoundParent } from '../../useCompound';
import { useList, ListOrientation } from '../../useList';
import { useForkRef } from '../../utils/useForkRef';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { TabsListContextValue } from './TabsListContext';
import { useControllableReducer } from '../../utils/useControllableReducer';
import { IndexableMap } from '../../utils/IndexableMap';
import { StateChangeCallback } from '../../utils/useControllableReducer.types';

const INITIAL_STATE: TabsReducerState = {
  highlightedValue: null,
  selectedValues: [],
  items: new IndexableMap(),
  tabsListRef: { current: null },
  settings: {
    activateOnFocus: false,
    disabledItemsFocusable: true,
    disableListWrap: false,
    focusManagement: 'DOM',
    orientation: 'horizontal-ltr',
    pageSize: 1,
    selectionMode: 'single',
  },
};

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
    tabActivationDirection,
  } = useTabsContext();

  const { subitems, context: compoundParentContext } = useCompoundParent<any, TabMetadata>();

  const tabIdLookup = React.useCallback(
    (tabValue: any) => {
      return subitems.get(tabValue)?.idAttribute;
    },
    [subitems],
  );

  registerTabIdLookup(tabIdLookup);

  const getTabElement = React.useCallback(
    (tabValue: any) => {
      if (tabValue == null) {
        return null;
      }

      return subitems.get(tabValue)?.ref.current ?? null;
    },
    [subitems],
  );

  let listOrientation: ListOrientation;
  if (orientation === 'vertical') {
    listOrientation = 'vertical';
  } else {
    listOrientation = direction === 'rtl' ? 'horizontal-rtl' : 'horizontal-ltr';
  }

  const tabsListRef = React.useRef<HTMLElement | null>(null);
  const detectActivationDirection = useActivationDirectionDetector(
    value,
    orientation,
    tabsListRef,
    getTabElement,
  );

  const handleChange: StateChangeCallback<TabsReducerState> = React.useCallback(
    (event, field, newValue) => {
      if (field === 'selectedValues') {
        const newSelectedValue = newValue[0] ?? null;
        const activationDirection = detectActivationDirection(newSelectedValue);
        onSelected(event, newValue[0] ?? null, activationDirection);
      }
    },
    [onSelected, detectActivationDirection],
  );

  const controlledProps = React.useMemo(() => {
    return value != null ? { selectedValues: [value] } : { selectedValues: [] };
  }, [value]);

  const initialState: TabsReducerState = React.useMemo(
    () => ({
      ...INITIAL_STATE,
      tabsListRef,
      settings: {
        ...INITIAL_STATE.settings,
        activateOnFocus,
        orientation: listOrientation,
        disableListWrap: !loop,
      },
    }),
    [activateOnFocus, listOrientation, loop],
  );

  const [state, dispatch] = useControllableReducer({
    reducer: tabsListReducer,
    controlledProps,
    initialState,
    onStateChange: handleChange,
  });

  const { getRootProps: getListboxRootProps, rootRef: mergedRootRef } = useList({
    dispatch,
    focusManagement: 'DOM',
    items: subitems,
    rootRef: externalRef,
    orientation: listOrientation,
    highlightedValue: state.highlightedValue,
    selectedValues: state.selectedValues,
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

  const contextValue: TabsListContextValue = React.useMemo(
    () => ({
      compoundParentContext,
      getTabElement,
      value,
      state,
      dispatch,
    }),
    [compoundParentContext, getTabElement, value, state, dispatch],
  );

  return {
    contextValue,
    dispatch,
    getRootProps,
    highlightedValue: state.highlightedValue,
    direction,
    orientation,
    rootRef: handleRef,
    selectedValue: state.selectedValues[0] ?? null,
    tabActivationDirection,
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
  tabsListRef: React.RefObject<HTMLElement>,
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

export { useTabsList };
