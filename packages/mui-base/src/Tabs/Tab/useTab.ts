'use client';
import * as React from 'react';
import { UseTabParameters, UseTabReturnValue } from './Tab.types';
import { useTabsContext } from '../Root/TabsContext';
import { TabMetadata } from '../Root/useTabsRoot';
import { useCompoundItem } from '../../useCompound';
import { useListItem } from '../../useList';
import { useButton } from '../../useButton';
import { useId } from '../../utils/useId';
import { useForkRef } from '../../utils/useForkRef';
import { mergeReactProps } from '../../utils/mergeReactProps';

function tabValueGenerator(otherTabValues: Set<any>) {
  return otherTabValues.size;
}

function useTab(parameters: UseTabParameters): UseTabReturnValue {
  const { value: valueParam, rootRef: externalRef, disabled = false, id: idParam } = parameters;

  const tabRef = React.useRef<HTMLElement>(null);
  const id = useId(idParam);

  const { value: selectedValue, getTabPanelId, orientation } = useTabsContext();

  const tabMetadata = React.useMemo(() => ({ disabled, ref: tabRef, id }), [disabled, tabRef, id]);

  const {
    id: value,
    index,
    totalItemCount: totalTabsCount,
  } = useCompoundItem<any, TabMetadata>(valueParam ?? tabValueGenerator, tabMetadata);

  const { getRootProps: getListItemProps, selected } = useListItem({
    item: value,
  });

  const { getRootProps: getButtonProps, rootRef: buttonRefHandler } = useButton({
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

export { useTab };
