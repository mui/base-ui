'use client';
import * as React from 'react';
import { useEventCallback } from '@base-ui-components/utils/useEventCallback';
import { useBaseUiId } from '../utils/useBaseUiId';
import type { BaseUIEventData } from '../utils/createBaseUIEventData';

const EMPTY: string[] = [];

export function useCheckboxGroupParent(
  params: useCheckboxGroupParent.Parameters,
): useCheckboxGroupParent.ReturnValue {
  const { allValues = EMPTY, value = EMPTY, onValueChange: onValueChangeProp } = params;

  const uncontrolledStateRef = React.useRef(value);
  const disabledStatesRef = React.useRef(new Map<string, boolean>());

  const [status, setStatus] = React.useState<'on' | 'off' | 'mixed'>('mixed');

  const id = useBaseUiId();
  const checked = value.length === allValues.length;
  const indeterminate = value.length !== allValues.length && value.length > 0;

  const onValueChange = useEventCallback(onValueChangeProp);

  const getParentProps: useCheckboxGroupParent.ReturnValue['getParentProps'] = React.useCallback(
    () => ({
      id,
      indeterminate,
      checked,
      'aria-controls': allValues.map((v) => `${id}-${v}`).join(' '),
      onCheckedChange(_, data) {
        const uncontrolledState = uncontrolledStateRef.current;

        // None except the disabled ones that are checked, which can't be changed.
        const none = allValues.filter(
          (v) => disabledStatesRef.current.get(v) && uncontrolledState.includes(v),
        );
        // "All" that are valid:
        // - any that aren't disabled
        // - disabled ones that are checked
        const all = allValues.filter(
          (v) =>
            !disabledStatesRef.current.get(v) ||
            (disabledStatesRef.current.get(v) && uncontrolledState.includes(v)),
        );

        const allOnOrOff =
          uncontrolledState.length === all.length || uncontrolledState.length === 0;

        if (allOnOrOff) {
          if (value.length === all.length) {
            onValueChange(none, data);
          } else {
            onValueChange(all, data);
          }
          return;
        }

        if (status === 'mixed') {
          onValueChange(all, data);
          setStatus('on');
        } else if (status === 'on') {
          onValueChange(none, data);
          setStatus('off');
        } else if (status === 'off') {
          onValueChange(uncontrolledState, data);
          setStatus('mixed');
        }
      },
    }),
    [allValues, checked, id, indeterminate, onValueChange, status, value.length],
  );

  const getChildProps: useCheckboxGroupParent.ReturnValue['getChildProps'] = React.useCallback(
    (name: string) => ({
      name,
      id: `${id}-${name}`,
      checked: value.includes(name),
      onCheckedChange(nextChecked, data) {
        const newValue = value.slice();
        if (nextChecked) {
          newValue.push(name);
        } else {
          newValue.splice(newValue.indexOf(name), 1);
        }
        uncontrolledStateRef.current = newValue;
        onValueChange(newValue, data);
        setStatus('mixed');
      },
    }),
    [id, onValueChange, value],
  );

  return React.useMemo(
    () => ({
      id,
      indeterminate,
      getParentProps,
      getChildProps,
      disabledStatesRef,
    }),
    [id, indeterminate, getParentProps, getChildProps],
  );
}

export namespace useCheckboxGroupParent {
  export interface Parameters {
    allValues?: string[];
    value?: string[];
    onValueChange?: (value: string[], data: BaseUIEventData<'none'>) => void;
  }

  export interface ReturnValue {
    id: string | undefined;
    indeterminate: boolean;
    disabledStatesRef: React.RefObject<Map<string, boolean>>;
    getParentProps: () => {
      id: string | undefined;
      indeterminate: boolean;
      checked: boolean;
      'aria-controls': string;
      onCheckedChange: (checked: boolean, data: BaseUIEventData<'none'>) => void;
    };
    getChildProps: (name: string) => {
      name: string;
      id: string;
      checked: boolean;
      onCheckedChange: (checked: boolean, data: BaseUIEventData<'none'>) => void;
    };
  }
}
