'use client';
import * as React from 'react';
import { unstable_useId as useId, unstable_useForkRef as useForkRef } from '@mui/utils';
import { useTabsContext } from '../Tabs/TabsContext';
import { UseTabParameters, UseTabReturnValue } from './useTab.types';
import { useCompoundItem } from '../useCompound';
import { useListItem } from '../useList';
import { useButton } from '../useButton';
import { TabMetadata } from '../useTabs';
import { combineHooksSlotProps } from '../utils/combineHooksSlotProps';
import { useTabsListContext } from '../Tabs/TabsList/TabsListContext';
import { mergeReactProps } from '../utils/mergeReactProps';

function tabValueGenerator(otherTabValues: Set<string | number>) {
  return otherTabValues.size;
}

/**
 *
 * Demos:
 *
 * - [Tabs](https://mui.com/base-ui/react-tabs/#hooks)
 *
 * API:
 *
 * - [useTab API](https://mui.com/base-ui/react-tabs/hooks-api/#use-tab)
 */
function useTab(parameters: UseTabParameters): UseTabReturnValue {
  const { value: valueParam, rootRef: externalRef, disabled = false, id: idParam } = parameters;

  const tabRef = React.useRef<HTMLElement>(null);
  const id = useId(idParam);

  const { value: selectedValue, getTabPanelId, orientation } = useTabsContext();
  const { activateOnFocus } = useTabsListContext();

  const tabMetadata = React.useMemo(() => ({ disabled, ref: tabRef, id }), [disabled, tabRef, id]);

  const {
    id: value,
    index,
    totalItemCount: totalTabsCount,
  } = useCompoundItem<string | number, TabMetadata>(valueParam ?? tabValueGenerator, tabMetadata);

  const { getRootProps: getListItemProps, selected } = useListItem({
    item: value,
  });

  const { getRootProps: getButtonProps, rootRef: buttonRefHandler } = useButton({
    disabled,
    focusableWhenDisabled: !activateOnFocus,
    type: 'button',
  });

  const handleRef = useForkRef(tabRef, externalRef, buttonRefHandler);

  const tabPanelId = value !== undefined ? getTabPanelId(value) : undefined;

  const getRootProps = React.useCallback(
    (externalProps = {}) => {
      const getCombinedRootProps = combineHooksSlotProps(getListItemProps, getButtonProps);

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
          getCombinedRootProps(),
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

export { useTab };
