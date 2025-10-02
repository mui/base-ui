'use client';
import * as React from 'react';
import { useEventCallback } from '@base-ui-components/utils/useEventCallback';
import { useBaseUiId } from '../utils/useBaseUiId';
import type { BaseUIChangeEventDetails } from '../utils/createBaseUIEventDetails';

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
    (parentId?: string) => ({
      indeterminate,
      checked,
      'aria-controls': allValues.map((v) => `${parentId ?? id}-${v}`).join(' '),
      onCheckedChange(_, eventDetails) {
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
            onValueChange(none, eventDetails);
          } else {
            onValueChange(all, eventDetails);
          }
          return;
        }

        if (status === 'mixed') {
          onValueChange(all, eventDetails);
          setStatus('on');
        } else if (status === 'on') {
          onValueChange(none, eventDetails);
          setStatus('off');
        } else if (status === 'off') {
          onValueChange(uncontrolledState, eventDetails);
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
      onCheckedChange(nextChecked, eventDetails) {
        const newValue = value.slice();
        if (nextChecked) {
          newValue.push(name);
        } else {
          newValue.splice(newValue.indexOf(name), 1);
        }
        uncontrolledStateRef.current = newValue;
        onValueChange(newValue, eventDetails);
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
    onValueChange?: (value: string[], eventDetails: BaseUIChangeEventDetails<'none'>) => void;
  }

  export interface ReturnValue {
    id: string | undefined;
    indeterminate: boolean;
    disabledStatesRef: React.RefObject<Map<string, boolean>>;
    getParentProps: (parentId?: string) => {
      indeterminate: boolean;
      checked: boolean;
      'aria-controls': string;
      onCheckedChange: (checked: boolean, eventDetails: BaseUIChangeEventDetails<'none'>) => void;
    };
    getChildProps: (name: string) => {
      name: string;
      id: string;
      checked: boolean;
      onCheckedChange: (checked: boolean, eventDetails: BaseUIChangeEventDetails<'none'>) => void;
    };
  }
}
