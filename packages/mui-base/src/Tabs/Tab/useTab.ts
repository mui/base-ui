'use client';
import * as React from 'react';
import { TabMetadata, UseTabParameters, UseTabReturnValue } from './Tab.types';
import { useCompoundItem } from '../../useCompound';
import { useListItem } from '../../useList';
import { useButton } from '../../useButton';
import { useId } from '../../utils/useId';
import { useForkRef } from '../../utils/useForkRef';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { GenericHTMLProps } from '../../utils/types';

function keyGenerator(index: number): number {
  return index;
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
  const {
    value: valueParam,
    rootRef: externalRef,
    disabled = false,
    id: idParam,
    compoundParentContext,
    state,
    orientation,
    getTabPanelId,
    dispatch,
  } = parameters;

  const tabRef = React.useRef<HTMLElement>(null);
  const id = useId(idParam);

  const tabMetadata: TabMetadata = React.useMemo(
    () => ({ disabled, ref: tabRef, idAttribute: id }),
    [disabled, tabRef, id],
  );

  const { key: value } = useCompoundItem<any, TabMetadata>({
    key: valueParam,
    keyGenerator,
    itemMetadata: tabMetadata,
    parentContext: compoundParentContext,
  });

  const selected = state.selectedValues.includes(value);
  const highlighted = state.highlightedValue === value;

  const { getRootProps: getListItemProps } = useListItem({
    item: value,
    dispatch,
    focusable: true,
    highlighted,
    selected,
  });

  const { getRootProps: getButtonProps, rootRef: buttonRefHandler } = useButton({
    disabled,
    focusableWhenDisabled: true,
    type: 'button',
  });

  const handleRef = useForkRef(tabRef, externalRef, buttonRefHandler);

  const tabPanelId = value !== undefined ? getTabPanelId(value) : undefined;

  const getRootProps = React.useCallback(
    (externalProps?: GenericHTMLProps) => {
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
    rootRef: handleRef,
    selected,
    orientation,
    value,
  };
}

export { useTab };
