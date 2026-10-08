'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { EMPTY_ARRAY } from '@base-ui/utils/empty';
import type { BaseUIChangeEventDetails } from '../internals/createBaseUIEventDetails';
import type { BaseUIEventReasons } from '../internals/reasons';

// Regardless of order: a value set from outside can hold the same values reordered, as when a
// nested group removes and appends its value.
function hasSameValues(a: readonly string[], b: readonly string[]) {
  return a.length === b.length && a.every((item) => b.includes(item));
}

export function useCheckboxGroupParent(
  params: UseCheckboxGroupParentParameters,
): UseCheckboxGroupParentReturnValue {
  const { allValues = EMPTY_ARRAY, value, onValueChange: onValueChangeProp } = params;

  const uncontrolledStateRef = React.useRef(value);
  // The value as the group last held it after a change this hook made. The parent's cycle only
  // holds while `value` still matches it.
  const lastValueRef = React.useRef(value);
  // Whether the hook's last change has yet to land. A change the group ignores without
  // canceling never lands, so the next value from outside is taken for it, and only one change
  // is tracked, so a second one made before the first lands is taken for an outside change.
  const ownChangeRef = React.useRef(false);
  const disabledStatesRef = React.useRef(new Map<string, boolean>());

  const [status, setStatus] = React.useState<'on' | 'off' | 'mixed'>('mixed');
  // A `Map` rather than an object: checkbox values are consumer data, and a value like
  // `constructor` would otherwise read straight off `Object.prototype`.
  // Replace only the wrapper to rerender without cloning the growing registry.
  const [childIdsState, setChildIdsState] = React.useState(() => ({
    registry: new Map<string, readonly string[]>(),
  }));

  const checked = value.length === allValues.length;
  const indeterminate = value.length !== allValues.length && value.length > 0;

  // Read the value back once the hook's change lands: the group may store it differently than
  // proposed. A new array with the same values hasn't landed it yet.
  useIsoLayoutEffect(() => {
    if (ownChangeRef.current && !hasSameValues(value, lastValueRef.current)) {
      ownChangeRef.current = false;
      lastValueRef.current = value;
    }
  }, [value]);

  const change = useStableCallback(
    (
      nextValue: string[],
      eventDetails: BaseUIChangeEventDetails<BaseUIEventReasons['none']>,
      nextUncontrolledState: string[],
      nextStatus: 'on' | 'off' | 'mixed',
    ) => {
      const wasPending = ownChangeRef.current;
      const lastValue = lastValueRef.current;

      // The change is read back against the value it was made from, which an outside change
      // may have moved on. Before the change, which the group may land synchronously.
      lastValueRef.current = value;
      ownChangeRef.current = true;
      onValueChangeProp?.(nextValue, eventDetails);

      if (eventDetails.isCanceled) {
        lastValueRef.current = lastValue;
        ownChangeRef.current = wasPending;
        return;
      }

      uncontrolledStateRef.current = nextUncontrolledState;
      setStatus(nextStatus);
    },
  );

  const registerChildId = useStableCallback((childValue: string, childId: string) => {
    const childIds = childIdsState.registry;
    childIds.set(childValue, (childIds.get(childValue) ?? EMPTY_ARRAY).concat(childId));
    setChildIdsState({ registry: childIds });

    return () => {
      const nextIds = (childIds.get(childValue) ?? EMPTY_ARRAY).filter((id) => id !== childId);
      if (nextIds.length === 0) {
        childIds.delete(childValue);
      } else {
        childIds.set(childValue, nextIds);
      }
      setChildIdsState({ registry: childIds });
    };
  });

  const getParentProps: UseCheckboxGroupParentReturnValue['getParentProps'] = React.useCallback(
    (indeterminateProp) => ({
      indeterminate,
      checked,
      // Children report their own rendered id, so a custom `id` survives and no unmounted
      // element is named.
      'aria-controls':
        allValues.flatMap((v) => childIdsState.registry.get(v) ?? EMPTY_ARRAY).join(' ') ||
        undefined,
      onCheckedChange(_, eventDetails) {
        let uncontrolledState = uncontrolledStateRef.current;
        let currentStatus = status;

        // Restart the cycle from `value`, as a child click does, when the value changed from
        // outside or when the parent's `indeterminate` prop reports a partial selection the value
        // doesn't hold, as with a nested group.
        if (!hasSameValues(value, lastValueRef.current) || (indeterminateProp && !indeterminate)) {
          uncontrolledState = value;
          currentStatus = 'mixed';
        }

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

        // With no mixed combination to return to, the parent toggles all and none by `value`.
        const allOnOrOff =
          uncontrolledState.length === all.length || uncontrolledState.length === none.length;

        let nextValue = all;
        let nextStatus: 'on' | 'off' | 'mixed' = 'on';

        if (allOnOrOff ? value.length === all.length : currentStatus === 'on') {
          nextValue = none;
          nextStatus = 'off';
        } else if (!allOnOrOff && currentStatus === 'off') {
          nextValue = uncontrolledState;
        }

        // Landing on the combination to return to is the mixed position, which holds the cycle
        // should that combination stop being all or none, as once a child is enabled.
        if (nextValue.length === uncontrolledState.length) {
          nextStatus = 'mixed';
        }

        change(nextValue, eventDetails, uncontrolledState, nextStatus);
      },
    }),
    [allValues, change, checked, childIdsState, indeterminate, status, value],
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

        change(newValue, eventDetails, newValue, 'mixed');
      },
    }),
    [change, value],
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
   * Reports the `id` of the element a child checkbox exposes.
   */
  registerChildId: (value: string, id: string) => () => void;
  /**
   * `indeterminateProp` is the parent checkbox's own `indeterminate` prop.
   */
  getParentProps: (indeterminateProp: boolean) => {
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
