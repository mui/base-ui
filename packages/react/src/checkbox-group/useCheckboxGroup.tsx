'use client';
import * as React from 'react';
import { useControlled } from '../utils/useControlled';
import { useEventCallback } from '../utils/useEventCallback';
import { useCheckboxGroupParent } from './useCheckboxGroupParent';
import { useFieldRootContext } from '../field/root/FieldRootContext';
import type { HTMLProps } from '../utils/types';

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

  const rootProps: HTMLProps = React.useMemo(
    () => ({
      role: 'group',
      'aria-labelledby': labelId,
    }),
    [labelId],
  );

  return React.useMemo(
    () => ({
      rootProps,
      value,
      setValue,
      parent,
    }),
    [rootProps, value, setValue, parent],
  );
}

export namespace useCheckboxGroup {
  export interface Parameters {
    value?: string[];
    defaultValue?: string[];
    onValueChange?: (value: string[], event: Event) => void;
    allValues?: string[];
  }

  export interface ReturnValue {
    rootProps: HTMLProps;
    value: string[];
    setValue: (value: string[], event: Event) => void;
    parent: useCheckboxGroupParent.ReturnValue;
  }
}
