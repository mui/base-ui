'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { EMPTY_ARRAY } from '@base-ui/utils/empty';
import { useBaseUiId } from '../internals/useBaseUiId';
import type { BaseUIChangeEventDetails } from '../internals/createBaseUIEventDetails';
import type { BaseUIEventReasons } from '../internals/reasons';

export function useCheckboxGroupParent(
  params: UseCheckboxGroupParentParameters,
): UseCheckboxGroupParentReturnValue {
  const { allValues = EMPTY_ARRAY, value, onValueChange: onValueChangeProp } = params;

  const uncontrolledStateRef = React.useRef(value);
  const disabledStatesRef = React.useRef(new Map<string, boolean>());

  const [status, setStatus] = React.useState<'on' | 'off' | 'mixed'>('mixed');

  const id = useBaseUiId();
  const checked = value.length === allValues.length;
  const indeterminate = value.length !== allValues.length && value.length > 0;

  const onValueChange = useStableCallback(onValueChangeProp);

  const getParentProps: UseCheckboxGroupParentReturnValue['getParentProps'] = React.useCallback(
    () => ({
      indeterminate,
      checked,
      // TODO: custom `id` on child checkboxes breaks this
      // https://github.com/mui/base-ui/issues/2691
      // React 17 assigns `id` after the first render, and children can't derive theirs before
      // then, so referencing them during that window would point at elements that don't exist.
      'aria-controls': id === undefined ? undefined : allValues.map((v) => `${id}-${v}`).join(' '),
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
    [allValues, checked, id, indeterminate, onValueChange, status, value.length],
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
      id,
      getParentProps,
      getChildProps,
      disabledStatesRef,
    }),
    [id, getParentProps, getChildProps],
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
  /**
   * The namespace the child checkboxes derive their ids from.
   */
  id: string | undefined;
  disabledStatesRef: React.RefObject<Map<string, boolean>>;
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
