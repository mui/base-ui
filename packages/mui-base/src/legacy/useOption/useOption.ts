'use client';
import * as React from 'react';
import { unstable_useForkRef as useForkRef, unstable_useId as useId } from '@mui/utils';
import { SelectOption, UseOptionParameters, UseOptionReturnValue } from './useOption.types';
import { useListItem } from '../../useList';
import { useCompoundItem } from '../../useCompound';
import { useButton } from '../../useButton';
import { GenericHTMLProps } from '../../utils/types';
import { mergeReactProps } from '../../utils/mergeReactProps';

/**
 *
 * Demos:
 *
 * - [Select](https://mui.com/base-ui/react-select/#hooks)
 *
 * API:
 *
 * - [useOption API](https://mui.com/base-ui/react-select/hooks-api/#use-option)
 */
export function useOption<Value>(params: UseOptionParameters<Value>): UseOptionReturnValue {
  const {
    value,
    label,
    disabled,
    rootRef: optionRefParam,
    id: idParam,
    highlighted,
    selected,
    dispatch,
    compoundParentContext,
    keyExtractor,
  } = params;

  const { getRootProps: getListItemProps } = useListItem({
    item: value,
    highlighted,
    selected,
    dispatch,
    focusable: true,
    handlePointerOverEvents: true,
  });

  const { getRootProps: getButtonProps, rootRef: buttonRefHandler } = useButton({
    disabled,
    focusableWhenDisabled: true,
  });

  const id = useId(idParam);

  const optionRef = React.useRef<HTMLElement>(null);

  const selectOption: SelectOption<Value> = React.useMemo(
    () => ({
      disabled,
      label,
      value,
      ref: optionRef,
      idAttribute: id,
    }),
    [disabled, label, value, id],
  );

  useCompoundItem({
    key: keyExtractor(value),
    itemMetadata: selectOption,
    parentContext: compoundParentContext,
  });

  const handleRef = useForkRef(optionRefParam, optionRef, buttonRefHandler)!;

  return {
    getRootProps: (externalProps?: GenericHTMLProps) => {
      return mergeReactProps(
        externalProps,
        {
          ref: handleRef,
        },
        getButtonProps(
          getListItemProps({
            id,
            role: 'option',
            'aria-selected': selected,
            onKeyDown: (event: React.KeyboardEvent) => {
              if ([' ', 'Enter'].includes(event.key)) {
                (event as any).defaultMuiPrevented = true; // prevent listbox onKeyDown
              }
            },
          }),
        ),
      );
    },
    rootRef: handleRef,
  };
}
