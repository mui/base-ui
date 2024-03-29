'use client';
import * as React from 'react';
import { unstable_useId as useId, unstable_useForkRef as useForkRef } from '@mui/utils';
import { useTabsContext } from '../Tabs/TabsContext';
import { UseTabParameters, UseTabReturnValue, UseTabRootSlotProps } from './useTab.types';
import { extractEventHandlers } from '../utils/extractEventHandlers';
import { useCompoundItem } from '../useCompound';
import { useListItem } from '../useList';
import { useButton } from '../useButton';
import { TabMetadata } from '../useTabs';
import { combineHooksSlotProps } from '../utils/combineHooksSlotProps';
import { useTabsListContext } from '../Tabs/TabsList/TabsListContext';

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

  const { getRootProps: getTabProps, selected } = useListItem({
    item: value,
  });

  const { getRootProps: getButtonProps, rootRef: buttonRefHandler } = useButton({
    disabled,
    focusableWhenDisabled: !activateOnFocus,
    type: 'button',
  });

  const handleRef = useForkRef(tabRef, externalRef, buttonRefHandler);

  const tabPanelId = value !== undefined ? getTabPanelId(value) : undefined;

  const getRootProps = <ExternalProps extends Record<string, unknown>>(
    externalProps: ExternalProps = {} as ExternalProps,
  ): UseTabRootSlotProps<ExternalProps> => {
    const externalEventHandlers = extractEventHandlers(externalProps);
    const getCombinedRootProps = combineHooksSlotProps(getTabProps, getButtonProps);

    return {
      ...externalProps,
      ...getCombinedRootProps(externalEventHandlers),
      role: 'tab',
      'aria-controls': tabPanelId,
      'aria-selected': selected,
      id,
      ref: handleRef,
    };
  };

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
