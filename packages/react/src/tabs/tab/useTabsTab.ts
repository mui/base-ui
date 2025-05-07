'use client';
import * as React from 'react';
import { mergeProps } from '../../merge-props';
import { ownerDocument } from '../../utils/owner';
import { useModernLayoutEffect } from '../../utils/useModernLayoutEffect';
import { useForkRef } from '../../utils/useForkRef';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useButton } from '../../use-button';
import { useCompositeItem } from '../../composite/item/useCompositeItem';
import type { TabsRootContext } from '../root/TabsRootContext';
import type { TabsList } from '../list/TabsList';

export interface TabMetadata {
  disabled: boolean;
  id: string | undefined;
  value: any | undefined;
}

export function useTabsTab(parameters: useTabsTab.Parameters): useTabsTab.ReturnValue {
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

  const id = useBaseUiId(idParam);

  const tabMetadata = React.useMemo(
    () => ({ disabled, id, value: valueParam }),
    [disabled, id, valueParam],
  );

  const {
    props: compositeItemProps,
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

  const isSelectionSyncedWithHighlightRef = React.useRef(false);

  useModernLayoutEffect(() => {
    if (isSelectionSyncedWithHighlightRef.current === true) {
      return;
    }
    if (activateOnFocus && selected && index > -1 && highlightedTabIndex !== index) {
      setHighlightedTabIndex(index);
      isSelectionSyncedWithHighlightRef.current = true;
    }
  }, [activateOnFocus, highlightedTabIndex, index, selected, setHighlightedTabIndex]);

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    focusableWhenDisabled: true,
  });

  const handleRef = useForkRef(compositeItemRef, buttonRef, externalRef);

  const tabPanelId = index > -1 ? getTabPanelIdByTabValueOrIndex(valueParam, index) : undefined;

  const isPressingRef = React.useRef(false);
  const isMainButtonRef = React.useRef(false);

  const getRootProps = React.useCallback(
    (externalProps = {}) => {
      return mergeProps<'button'>(
        {
          role: 'tab',
          'aria-controls': tabPanelId,
          'aria-selected': selected,
          id,
          ref: handleRef,
          onClick(event: React.MouseEvent<HTMLButtonElement>) {
            if (selected || disabled) {
              return;
            }

            onTabActivation(tabValue, event.nativeEvent);
          },
          onFocus(event: React.FocusEvent<HTMLButtonElement>) {
            if (selected) {
              return;
            }

            if (index > 1 && index !== highlightedTabIndex) {
              setHighlightedTabIndex(index);
            }

            if (disabled) {
              return;
            }

            if (
              (activateOnFocus && !isPressingRef.current) || // keyboard focus
              (isPressingRef.current && isMainButtonRef.current) // focus caused by pointerdown
            ) {
              onTabActivation(tabValue, event.nativeEvent);
            }
          },
          onPointerDown(event: React.PointerEvent<HTMLButtonElement>) {
            if (selected || disabled) {
              return;
            }

            isPressingRef.current = true;

            function handlePointerUp() {
              isPressingRef.current = false;
              isMainButtonRef.current = false;
            }

            if (!event.button || event.button === 0) {
              isMainButtonRef.current = true;

              const doc = ownerDocument(event.currentTarget);
              doc.addEventListener('pointerup', handlePointerUp, { once: true });
            }
          },
        },
        externalProps,
        getButtonProps,
        compositeItemProps,
      );
    },
    [
      activateOnFocus,
      getButtonProps,
      compositeItemProps,
      handleRef,
      id,
      onTabActivation,
      selected,
      tabPanelId,
      tabValue,
      disabled,
      index,
      setHighlightedTabIndex,
      highlightedTabIndex,
    ],
  );

  return {
    getRootProps,
    index,
    rootRef: handleRef,
    selected,
  };
}

export namespace useTabsTab {
  export interface Parameters
    extends Pick<TabsRootContext, 'getTabPanelIdByTabValueOrIndex'>,
      Pick<TabsList.Props, 'activateOnFocus'> {
    onTabActivation: (newValue: any, event: Event) => void;
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
     * Whether the component should ignore user interaction.
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
     * Whether the tab is currently selected.
     */
    selected: boolean;
  }
}
