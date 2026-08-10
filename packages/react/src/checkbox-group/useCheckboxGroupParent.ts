'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { EMPTY_ARRAY, EMPTY_OBJECT } from '@base-ui/utils/empty';
import type { BaseUIChangeEventDetails } from '../internals/createBaseUIEventDetails';
import type { BaseUIEventReasons } from '../internals/reasons';

export function useCheckboxGroupParent(
  params: UseCheckboxGroupParentParameters,
): UseCheckboxGroupParentReturnValue {
  const { allValues = EMPTY_ARRAY, value, onValueChange: onValueChangeProp } = params;

  const uncontrolledStateRef = React.useRef(value);
  const disabledStatesRef = React.useRef(new Map<string, boolean>());

  const [status, setStatus] = React.useState<'on' | 'off' | 'mixed'>('mixed');
  const [childIds, setChildIds] = React.useState<Record<string, string>>(EMPTY_OBJECT);

  const checked = value.length === allValues.length;
  const indeterminate = value.length !== allValues.length && value.length > 0;

  const onValueChange = useStableCallback(onValueChangeProp);

  const registerChildId = useStableCallback((childValue: string, childId: string | undefined) => {
    setChildIds((prev) => {
      if (prev[childValue] === childId) {
        return prev;
      }

      const next = { ...prev };
      if (childId === undefined) {
        delete next[childValue];
      } else {
        next[childValue] = childId;
      }
      return next;
    });
  });

  const getParentProps: UseCheckboxGroupParentReturnValue['getParentProps'] = React.useCallback(
    () => ({
      indeterminate,
      checked,
      // Children report the id of the element they expose, so the reference survives a custom
      // `id` and never names an element that isn't rendered. It stays out of server markup,
      // where the parent can't control anything yet.
      'aria-controls':
        allValues
          .map((v) => childIds[v])
          .filter((childId) => childId !== undefined)
          .join(' ') || undefined,
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
          (v) => !disabledStatesRef.current.get(v) || uncontrolledState.includes(v),
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

        let nextStatus: 'on' | 'off' | 'mixed' = 'mixed';
        let nextValue = uncontrolledState;

        if (status === 'mixed') {
          nextStatus = 'on';
          nextValue = all;
        } else if (status === 'on') {
          nextStatus = 'off';
          nextValue = none;
        }

        onValueChange(nextValue, eventDetails);

        if (!eventDetails.isCanceled) {
          setStatus(nextStatus);
        }
      },
    }),
    [allValues, checked, childIds, indeterminate, onValueChange, status, value.length],
  );

  const getChildProps: UseCheckboxGroupParentReturnValue['getChildProps'] = React.useCallback(
    (childValue: string) => ({
      checked: value.includes(childValue),
      onCheckedChange(nextChecked, eventDetails) {
        const newValue = value.slice();
        if (nextChecked) {
          newValue.push(childValue);
        } else {
          newValue.splice(newValue.indexOf(childValue), 1);
        }

        onValueChange(newValue, eventDetails);

        if (!eventDetails.isCanceled) {
          uncontrolledStateRef.current = newValue;
          setStatus('mixed');
        }
      },
    }),
    [onValueChange, value],
  );

  return React.useMemo(
    () => ({
      getParentProps,
      getChildProps,
      registerChildId,
      disabledStatesRef,
    }),
    [getParentProps, getChildProps, registerChildId],
  );
}

export interface UseCheckboxGroupParentParameters {
  allValues?: string[] | undefined;
  value: string[];
  onValueChange?:
    | ((
        value: string[],
        eventDetails: BaseUIChangeEventDetails<BaseUIEventReasons['none']>,
      ) => void)
    | undefined;
}

export interface UseCheckboxGroupParentReturnValue {
  disabledStatesRef: React.RefObject<Map<string, boolean>>;
  /**
   * Reports the `id` of the element a child checkbox exposes, so the parent can reference it
   * through `aria-controls`. Pass `undefined` to unregister.
   */
  registerChildId: (value: string, id: string | undefined) => void;
  getParentProps: () => {
    indeterminate: boolean;
    checked: boolean;
    'aria-controls': string | undefined;
    onCheckedChange: (
      checked: boolean,
      eventDetails: BaseUIChangeEventDetails<BaseUIEventReasons['none']>,
    ) => void;
  };
  getChildProps: (value: string) => {
    checked: boolean;
    onCheckedChange: (
      checked: boolean,
      eventDetails: BaseUIChangeEventDetails<BaseUIEventReasons['none']>,
    ) => void;
  };
}
