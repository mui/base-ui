'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { EMPTY_ARRAY } from '@base-ui/utils/empty';
import type { BaseUIChangeEventDetails } from '../internals/createBaseUIEventDetails';
import type { BaseUIEventReasons } from '../internals/reasons';

function hasSameValues(a: readonly string[], b: readonly string[]) {
  return a.length === b.length && a.every((v) => b.includes(v));
}

export function useCheckboxGroupParent(
  params: UseCheckboxGroupParentParameters,
): UseCheckboxGroupParentReturnValue {
  const { allValues = EMPTY_ARRAY, value, onValueChange: onValueChangeProp } = params;

  // The parent's last proposed value, the mixed selection it returns to, and the `value` it was
  // stored as, to tell when `value` was changed from outside. Until it's stored, `value` is the
  // one it replaced, so a handler that stores a transformed selection still advances the cycle.
  const parentChangeRef = React.useRef<ParentChange | null>(null);
  const disabledStatesRef = React.useRef(new Map<string, boolean>());

  // A `Map` rather than an object: checkbox values are consumer data, and a value like
  // `constructor` would otherwise read straight off `Object.prototype`.
  // Replace only the wrapper to rerender without cloning the growing registry.
  const [childIdsState, setChildIdsState] = React.useState(() => ({
    registry: new Map<string, readonly string[]>(),
  }));

  const checked = value.length === allValues.length;
  const indeterminate = value.length !== allValues.length && value.length > 0;

  const onValueChange = useStableCallback(onValueChangeProp);

  useIsoLayoutEffect(() => {
    const parentChange = parentChangeRef.current;
    if (parentChange?.pending && !hasSameValues(value, parentChange.value)) {
      parentChange.value = value;
      parentChange.pending = false;
    }
  }, [value]);

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
        const disabledStates = disabledStatesRef.current;
        // Disabled children keep their current state.
        const none = allValues.filter((v) => disabledStates.get(v) && value.includes(v));
        const all = allValues.filter((v) => !disabledStates.get(v) || value.includes(v));

        // Advance from what the parent proposed rather than what the handler stored. Restart the
        // cycle from a value set from outside or by a child, or from a partial selection only the
        // parent's `indeterminate` prop knows about, as with a nested group.
        let proposed = value;
        let mixed = value;
        const parentChange = parentChangeRef.current;
        if (
          parentChange &&
          hasSameValues(value, parentChange.value) &&
          !(indeterminateProp && !indeterminate)
        ) {
          ({ proposed, mixed } = parentChange);
        }

        let nextValue = all;
        if (hasSameValues(proposed, all)) {
          nextValue = none;
        } else if (
          hasSameValues(proposed, none) &&
          mixed.length > none.length &&
          mixed.length < all.length
        ) {
          nextValue = mixed;
        }

        // Set before the change so a value stored synchronously is read back.
        parentChangeRef.current = { proposed: nextValue, mixed, value, pending: true };

        onValueChange(nextValue, eventDetails);

        if (eventDetails.isCanceled) {
          parentChangeRef.current = parentChange;
        }
      },
    }),
    [allValues, checked, childIdsState, indeterminate, onValueChange, value],
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
          parentChangeRef.current = null;
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

interface ParentChange {
  proposed: string[];
  mixed: string[];
  value: string[];
  pending: boolean;
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
  getParentProps: (indeterminate: boolean) => {
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
