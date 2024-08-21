'use client';
import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import type {
  UseCheckboxGroupRootParameters,
  UseCheckboxGroupRootReturnValue,
} from './useCheckboxGroupRoot.types';
import { useControlled } from '../../utils/useControlled';
import { useEventCallback } from '../../utils/useEventCallback';
import { useCheckboxGroupParent } from '../Parent/useCheckboxGroupParent';
import { useFieldRootContext } from '../../Field/Root/FieldRootContext';

/**
 *
 * API:
 *
 * - [useCheckboxGroupRoot API](https://mui.com/base-ui/api/use-checkbox-group-root/)
 */
export function useCheckboxGroupRoot(
  params: UseCheckboxGroupRootParameters,
): UseCheckboxGroupRootReturnValue {
  const { allValues, value: externalValue, defaultValue, onValueChange } = params;

  const { labelId } = useFieldRootContext();

  const [value, setValueUnwrapped] = useControlled({
    controlled: externalValue,
    default: defaultValue,
    name: 'CheckboxGroup',
    state: 'value',
  });

  const setValue = useEventCallback((v: string[]) => {
    setValueUnwrapped(v);
    onValueChange?.(v);
  });

  const parent = useCheckboxGroupParent({
    allValues,
    value: externalValue,
    onValueChange,
  });

  const getRootProps = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps<'div'>(externalProps, {
        role: 'group',
        'aria-labelledby': labelId,
      }),
    [labelId],
  );

  return React.useMemo(
    () => ({
      getRootProps,
      value,
      setValue,
      parent,
    }),
    [getRootProps, value, setValue, parent],
  );
}
