'use client';
import * as React from 'react';
import { useTabsRootContext } from '../Root/TabsRootContext';
import { TabMetadata } from '../Root/useTabsRoot';
import { useCompoundItem } from '../../useCompound';
import { useListItem } from '../../useList';
import { useButton } from '../../useButton';
import { useId } from '../../utils/useId';
import { useForkRef } from '../../utils/useForkRef';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { TabsOrientation } from '../Root/TabsRoot';

function tabValueGenerator(otherTabValues: Set<any>) {
  return otherTabValues.size;
}

function useTab(parameters: useTab.Parameters): useTab.ReturnValue {
  const { value: valueParam, rootRef: externalRef, disabled = false, id: idParam } = parameters;

  const tabRef = React.useRef<HTMLElement>(null);
  const id = useId(idParam);

  const { value: selectedValue, getTabPanelId, orientation } = useTabsRootContext();

  const tabMetadata = React.useMemo(() => ({ disabled, ref: tabRef, id }), [disabled, tabRef, id]);

  const {
    id: value,
    index,
    totalItemCount: totalTabsCount,
  } = useCompoundItem<any, TabMetadata>(valueParam ?? tabValueGenerator, tabMetadata);

  const { getRootProps: getListItemProps, selected } = useListItem({
    item: value,
  });

  const { getButtonProps, buttonRef: buttonRefHandler } = useButton({
    disabled,
    focusableWhenDisabled: true,
    type: 'button',
  });

  const handleRef = useForkRef(tabRef, externalRef, buttonRefHandler);

  const tabPanelId = value !== undefined ? getTabPanelId(value) : undefined;

  const getRootProps = React.useCallback(
    (externalProps = {}) => {
      //
      return mergeReactProps<'button'>(
        externalProps,
        mergeReactProps<'button'>(
          {
            role: 'tab',
            'aria-controls': tabPanelId,
            'aria-selected': selected,
            id,
            ref: handleRef,
          },
          mergeReactProps(getListItemProps(), getButtonProps()),
        ),
      );
    },
    [getButtonProps, getListItemProps, handleRef, id, selected, tabPanelId],
  );

  return {
    getRootProps,
    index,
    rootRef: handleRef,
    // the `selected` state isn't set on the server (it relies on effects to be calculated),
    // so we fall back to checking the `value` prop with the selectedValue from the TabsContext
    selected: selected || value === selectedValue,
    totalTabsCount,
    orientation,
  };
}

namespace useTab {
  export interface Parameters {
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
    orientation: TabsOrientation;
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
