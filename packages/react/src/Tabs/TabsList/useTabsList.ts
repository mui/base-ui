'use client';
import * as React from 'react';
import { TabsListActionTypes, tabsListReducer, ValueChangeAction } from './tabsListReducer';
import { useTabsRootContext } from '../Root/TabsRootContext';
import { type TabMetadata } from '../Root/useTabsRoot';
import { type TabsOrientation, type TabActivationDirection } from '../Root/TabsRoot';
import { useCompoundParent } from '../../useCompound';
import { useList, ListState, UseListParameters, ListAction } from '../../useList';
import { useForkRef } from '../../utils/useForkRef';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { TabsDirection } from '../Root/TabsRoot';
import { TabsListProviderValue } from './TabsListProvider';

function useTabsList(parameters: useTabsList.Parameters): useTabsList.ReturnValue {
  const { rootRef: externalRef, loop, activateOnFocus } = parameters;

  const {
    direction = 'ltr',
    onSelected,
    orientation = 'horizontal',
    value,
    registerTabIdLookup,
    tabActivationDirection,
  } = useTabsRootContext();

  const { subitems, contextValue: compoundComponentContextValue } = useCompoundParent<
    any,
    TabMetadata
  >();

  const tabIdLookup = React.useCallback(
    (tabValue: any) => {
      return subitems.get(tabValue)?.id;
    },
    [subitems],
  );

  registerTabIdLookup(tabIdLookup);

  const subitemKeys = React.useMemo(() => Array.from(subitems.keys()), [subitems]);

  const getTabElement = React.useCallback(
    (tabValue: any) => {
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

  const tabsListRef = React.useRef<HTMLElement>(null);
  const detectActivationDirection = useActivationDirectionDetector(
    value,
    orientation,
    tabsListRef,
    getTabElement,
  );

  const handleChange = React.useCallback(
    (
      event:
        | React.FocusEvent<Element, Element>
        | React.KeyboardEvent<Element>
        | React.MouseEvent<Element, MouseEvent>
        | null,
      newValue: any[],
    ) => {
      const newSelectedValue = newValue[0] ?? null;
      const activationDirection = detectActivationDirection(newSelectedValue);
      onSelected(event?.nativeEvent, newValue[0] ?? null, activationDirection);
    },
    [onSelected, detectActivationDirection],
  );

  const controlledProps = React.useMemo(() => {
    return value != null ? { selectedValues: [value] } : { selectedValues: [] };
  }, [value]);

  const isItemDisabled = React.useCallback(
    (item: any) => subitems.get(item)?.disabled ?? false,
    [subitems],
  );

  const {
    contextValue: listContextValue,
    dispatch,
    getRootProps: getListboxRootProps,
    state: { highlightedValue, selectedValues },
    rootRef: mergedRootRef,
  } = useList<any, ListState<any>, ValueChangeAction, { activateOnFocus: boolean }>({
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
  export interface Parameters {
    /**
     * If `true`, the tab will be activated whenever it is focused.
     * Otherwise, it has to be activated by clicking or pressing the Enter or Space key.
     */
    activateOnFocus: boolean;
    /**
     * If `true`, using keyboard navigation will wrap focus to the other end of the list once the end is reached.
     */
    loop: boolean;
    /**
     * Ref to the root element.
     */
    rootRef: React.Ref<Element>;
  }

  export interface ReturnValue {
    /**
     * The value to be passed to the TabListProvider above all the tabs.
     */
    contextValue: TabsListProviderValue;
    /**
     * Action dispatcher for the tabs list component.
     * Allows to programmatically control the tabs list.
     */
    dispatch: (action: ListAction<any>) => void;
    /**
     * Resolver for the root slot's props.
     * @param externalProps props for the root slot
     * @returns props that should be spread on the root slot
     */
    getRootProps: (
      externalProps?: React.ComponentPropsWithRef<'div'>,
    ) => React.ComponentPropsWithRef<'div'>;
    /**
     * The value of the currently highlighted tab.
     */
    highlightedValue: any | null;
    /**
     * If `true`, it will indicate that the text's direction in right-to-left.
     */
    direction: TabsDirection;
    /**
     * The component orientation (layout flow direction).
     */
    orientation: TabsOrientation;
    rootRef: React.RefCallback<Element> | null;
    /**
     * The value of the currently selected tab.
     */
    selectedValue: any | null;
    tabActivationDirection: TabActivationDirection;
  }
}

export { useTabsList };
