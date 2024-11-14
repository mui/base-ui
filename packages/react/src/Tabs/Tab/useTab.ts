'use client';
import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useForkRef } from '../../utils/useForkRef';
import { useId } from '../../utils/useId';
import { useButton } from '../../useButton';
import { useCompositeItem } from '../../Composite/Item/useCompositeItem';
import type { TabsRootContext } from '../Root/TabsRootContext';
import type { useTabsList } from '../TabsList/useTabsList';

export interface TabMetadata {
  disabled: boolean;
  id: string | undefined;
}

function useTab(parameters: useTab.Parameters): useTab.ReturnValue {
  const {
    disabled = false,
    getTabPanelIdByTabValueOrIndex,
    id: idParam,
    isSelected,
    onTabActivation,
    rootRef: externalRef,
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
  } = useCompositeItem<TabMetadata>({ metadata: tabMetadata });

  const tabValue = valueParam ?? index;

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
            'aria-selected': false,
            id,
            ref: handleRef,
            onClick(event) {
              onTabActivation(tabValue, event.nativeEvent);
            },
          },
          mergeReactProps(getItemProps(), getButtonProps()),
        ),
      );
    },
    [getButtonProps, getItemProps, handleRef, id, onTabActivation, tabPanelId, tabValue],
  );

  return {
    getRootProps,
    index,
    rootRef: handleRef,
    // the `selected` state isn't set on the server (it relies on effects to be calculated),
    // so we fall back to checking the `value` prop with the selectedValue from the TabsContext
    selected: /* selected || */ isSelected,
    // TODO: recalculate this using Composite stuff, but is it really needed?
    totalTabsCount: -1,
  };
}

namespace useTab {
  export interface Parameters
    extends Pick<TabsRootContext, 'getTabPanelIdByTabValueOrIndex'>,
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
    /**
     * The id of the tab.
     * If not provided, it will be automatically generated.
     */
    id?: string;
    isSelected: boolean;
    /**
     * Ref to the root slot's DOM element.
     */
    rootRef?: React.Ref<Element>;
  }

  export interface ReturnValue {
    /**
     * Resolver for the root slot's props.
     * @param externalProps props for the root slot
     * @returns props that should be spread on the root slot
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
    /**
     * Total number of tabs in the nearest parent TabsList.
     * This can be used to determine if the tab is the last one to style it accordingly.
     */
    totalTabsCount: number;
  }
}

export { useTab };
