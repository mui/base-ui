'use client';
import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { useForkRef } from '../../utils/useForkRef';
import { useId } from '../../utils/useId';
import { useButton } from '../../use-button';
import { useCompositeItem } from '../../composite/item/useCompositeItem';
import type { TabsRootContext } from '../root/TabsRootContext';
import type { useTabsList } from '../tabs-list/useTabsList';
import type { TabsList } from '../tabs-list/TabsList';

export interface TabMetadata {
  disabled: boolean;
  id: string | undefined;
  value: any | undefined;
}

function useTab(parameters: useTab.Parameters): useTab.ReturnValue {
  const {
    activateOnFocus,
    disabled = false,
    getTabPanelIdByTabValueOrIndex,
    highlightedTabIndex,
    id: idParam,
    onTabActivation,
    rootRef: externalRef,
    selectedTabValue,
    setHighlightedTabIndex,
    value: valueParam,
  } = parameters;

  const id = useId(idParam);

  const tabMetadata = React.useMemo(
    () => ({ disabled, id, value: valueParam }),
    [disabled, id, valueParam],
  );

  const {
    getItemProps,
    ref: compositeItemRef,
    index,
    // hook is used instead of the CompositeItem component
    // because the index is needed for Tab internals
  } = useCompositeItem<TabMetadata>({ metadata: tabMetadata });

  const tabValue = valueParam ?? index;

  // the `selected` state isn't set on the server (it relies on effects to be calculated),
  // so we fall back to checking the `value` param with the selectedTabValue from the TabsContext
  const selected = React.useMemo(() => {
    if (valueParam === undefined) {
      return index < 0 ? false : index === selectedTabValue;
    }

    return valueParam === selectedTabValue;
  }, [index, selectedTabValue, valueParam]);

  // when activateOnFocus is `true`, ensure the active item in Composite's roving
  // focus group matches the selected Tab
  useEnhancedEffect(() => {
    if (activateOnFocus && selected && index > -1 && highlightedTabIndex !== index) {
      setHighlightedTabIndex(index);
    }
  }, [activateOnFocus, highlightedTabIndex, index, selected, setHighlightedTabIndex]);

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    focusableWhenDisabled: true,
    type: 'button',
  });

  const handleRef = useForkRef(compositeItemRef, buttonRef, externalRef);

  const tabPanelId = index > -1 ? getTabPanelIdByTabValueOrIndex(valueParam, index) : undefined;

  const getRootProps = React.useCallback(
    (externalProps = {}) => {
      return mergeReactProps<'button'>(
        externalProps,
        mergeReactProps<'button'>(
          {
            role: 'tab',
            'aria-controls': tabPanelId,
            'aria-selected': selected,
            id,
            ref: handleRef,
            onClick(event) {
              onTabActivation(tabValue, event.nativeEvent);
            },
            onFocus(event) {
              if (!activateOnFocus) {
                return;
              }

              if (selectedTabValue !== tabValue) {
                onTabActivation(tabValue, event.nativeEvent);
              }
            },
          },
          mergeReactProps(getItemProps(), getButtonProps()),
        ),
      );
    },
    [
      activateOnFocus,
      getButtonProps,
      getItemProps,
      handleRef,
      id,
      onTabActivation,
      selected,
      selectedTabValue,
      tabPanelId,
      tabValue,
    ],
  );

  return {
    getRootProps,
    index,
    rootRef: handleRef,
    selected,
  };
}

namespace useTab {
  export interface Parameters
    extends Pick<TabsRootContext, 'getTabPanelIdByTabValueOrIndex'>,
      Pick<TabsList.Props, 'activateOnFocus'>,
      Pick<useTabsList.ReturnValue, 'onTabActivation'> {
    /**
     * The value of the tab.
     * It's used to associate the tab with a tab panel(s) with the same value.
     * If the value is not provided, it falls back to the position index.
     */
    value?: any;
    /**
     * Callback fired when the tab is clicked.
     */
    onClick?: React.MouseEventHandler;
    /**
     * If `true`, the tab will be disabled.
     */
    disabled?: boolean;
    highlightedTabIndex: number;
    /**
     * The id of the tab.
     * If not provided, it will be automatically generated.
     */
    id?: string;
    selectedTabValue: TabsRootContext['value'];
    setHighlightedTabIndex: (index: number) => void;
    /**
     * Ref to the root slot's DOM element.
     */
    rootRef?: React.Ref<Element>;
  }

  export interface ReturnValue {
    /**
     * Resolver for the Tab component's props.
     * @param externalProps additional props for Tabs.Tab
     * @returns props that should be spread on Tabs.Tab
     */
    getRootProps: (
      externalProps?: React.ComponentPropsWithRef<'button'>,
    ) => React.ComponentPropsWithRef<'button'>;
    /**
     * 0-based index of the tab in the list of tabs.
     */
    index: number;
    /**
     * Ref to the root slot's DOM element.
     */
    rootRef: React.RefCallback<Element> | null;
    /**
     * If `true`, the tab is selected.
     */
    selected: boolean;
  }
}

export { useTab };
