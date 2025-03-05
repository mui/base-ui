'use client';
import * as React from 'react';
import { mergeReactProps } from '../utils/mergeReactProps';
import { useControlled } from '../utils/useControlled';
import { useEventCallback } from '../utils/useEventCallback';
import { useCheckboxGroupParent } from './useCheckboxGroupParent';
import { useFieldRootContext } from '../field/root/FieldRootContext';
import type { GenericHTMLProps } from '../utils/types';

export function useCheckboxGroup(
  params: useCheckboxGroup.Parameters,
): useCheckboxGroup.ReturnValue {
  const { allValues, value: externalValue, defaultValue, onValueChange } = params;

  const { labelId } = useFieldRootContext();

  const [value, setValueUnwrapped] = useControlled({
    controlled: externalValue,
    default: defaultValue,
    name: 'CheckboxGroup',
    state: 'value',
  });

  const setValue = useEventCallback((v: string[], event: Event) => {
    setValueUnwrapped(v);
    onValueChange?.(v, event);
  });

  const parent = useCheckboxGroupParent({
    allValues,
    value: externalValue,
    onValueChange,
  });

  const getRootProps = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps(
        {
          role: 'group',
          'aria-labelledby': labelId,
        },
        externalProps,
      ),
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

namespace useCheckboxGroup {
  export interface Parameters {
    value?: string[];
    defaultValue?: string[];
    onValueChange?: (value: string[], event: Event) => void;
    allValues?: string[];
  }

  export interface ReturnValue {
    getRootProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
    value: string[];
    setValue: (value: string[], event: Event) => void;
    parent: useCheckboxGroupParent.ReturnValue;
  }
}
