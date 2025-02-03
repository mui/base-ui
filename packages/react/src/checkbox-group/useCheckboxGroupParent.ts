'use client';
import * as React from 'react';
import { useBaseUiId } from '../utils/useBaseUiId';
import { useEventCallback } from '../utils/useEventCallback';

export function useCheckboxGroupParent(
  params: UseCheckboxGroupParent.Parameters,
): UseCheckboxGroupParent.ReturnValue {
  const { allValues = [], value = [], onValueChange: onValueChangeProp } = params;

  const uncontrolledStateRef = React.useRef(value);
  const disabledStatesRef = React.useRef(new Map<string, boolean>());

  const [status, setStatus] = React.useState<'on' | 'off' | 'mixed'>('mixed');

  const id = useBaseUiId();
  const checked = value.length === allValues.length;
  const indeterminate = value.length !== allValues.length && value.length > 0;

  const onValueChange = useEventCallback(onValueChangeProp);

  const getParentProps: UseCheckboxGroupParent.ReturnValue['getParentProps'] = React.useCallback(
    () => ({
      id,
      indeterminate,
      checked,
      'aria-controls': allValues.map((v) => `${id}-${v}`).join(' '),
      onCheckedChange(_, event) {
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
            onValueChange(none, event);
          } else {
            onValueChange(all, event);
          }
          return;
        }

        if (status === 'mixed') {
          onValueChange(all, event);
          setStatus('on');
        } else if (status === 'on') {
          onValueChange(none, event);
          setStatus('off');
        } else if (status === 'off') {
          onValueChange(uncontrolledState, event);
          setStatus('mixed');
        }
      },
    }),
    [allValues, checked, id, indeterminate, onValueChange, status, value.length],
  );

  const getChildProps: UseCheckboxGroupParent.ReturnValue['getChildProps'] = React.useCallback(
    (name: string) => ({
      name,
      id: `${id}-${name}`,
      checked: value.includes(name),
      onCheckedChange(nextChecked, event) {
        const newValue = [...value];
        if (nextChecked) {
          newValue.push(name);
        } else {
          newValue.splice(newValue.indexOf(name), 1);
        }
        uncontrolledStateRef.current = newValue;
        onValueChange(newValue, event);
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

export namespace UseCheckboxGroupParent {
  export interface Parameters {
    allValues?: string[];
    value?: string[];
    onValueChange?: (value: string[], event: Event) => void;
  }

  export interface ReturnValue {
    id: string | undefined;
    indeterminate: boolean;
    disabledStatesRef: React.MutableRefObject<Map<string, boolean>>;
    getParentProps: () => {
      id: string | undefined;
      indeterminate: boolean;
      checked: boolean;
      'aria-controls': string;
      onCheckedChange: (checked: boolean, event: Event) => void;
    };
    getChildProps: (name: string) => {
      name: string;
      id: string;
      checked: boolean;
      onCheckedChange: (checked: boolean, event: Event) => void;
    };
  }
}
