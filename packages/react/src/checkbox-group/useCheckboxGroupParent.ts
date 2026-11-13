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

// The last change, unless `value` was set from outside since.
function getLastChange(lastChange: LastChange | null, value: string[]) {
  return lastChange && hasSameValues(value, lastChange.values[0]) ? lastChange : null;
}

export function useCheckboxGroupParent(
  params: UseCheckboxGroupParentParameters,
): UseCheckboxGroupParentReturnValue {
  const { allValues = EMPTY_ARRAY, value, onValueChange } = params;

  // The last proposed value and the mixed selection the parent returns to, which the cycle
  // advances from. `values` holds the last value stored, then the proposals that haven't landed
  // yet, so a `value` that doesn't match the first was set from outside.
  const lastChangeRef = React.useRef<LastChange | null>(null);
  const [changeCommit, forceRender] = React.useState({});
  const disabledStatesRef = React.useRef(new Map<string, boolean>());

  // A `Map` rather than an object: checkbox values are consumer data, and a value like
  // `constructor` would otherwise read straight off `Object.prototype`.
  // Replace only the wrapper to rerender without cloning the growing registry.
  const [childIdsState, setChildIdsState] = React.useState(() => ({
    registry: new Map<string, readonly string[]>(),
  }));

  const checked = value.length === allValues.length;
  const indeterminate = value.length !== allValues.length && value.length > 0;

  useIsoLayoutEffect(() => {
    const lastChange = lastChangeRef.current;
    if (!lastChange) {
      return;
    }
    const index = lastChange.values.findIndex((v) => hasSameValues(value, v));
    if (index !== -1) {
      lastChange.values = lastChange.values.slice(index);
    } else if (lastChange.pending) {
      // Stored in the commit the change renders in, but transformed by the handler.
      lastChange.values = [value];
    }
    lastChange.pending = false;
  }, [value, changeCommit]);

  const changeValue = useStableCallback(
    (
      nextValue: string[],
      mixed: string[],
      eventDetails: BaseUIChangeEventDetails<BaseUIEventReasons['none']>,
    ) => {
      onValueChange?.(nextValue, eventDetails);

      if (!eventDetails.isCanceled) {
        lastChangeRef.current = {
          proposed: nextValue,
          mixed,
          values: [...(getLastChange(lastChangeRef.current, value)?.values ?? [value]), nextValue],
          pending: true,
        };
        // Commits even when the handler ignores the change, so a later `value` isn't taken as it.
        forceRender({});
      }
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
        const disabledStates = disabledStatesRef.current;
        // Disabled children keep their current state.
        const none = allValues.filter((v) => disabledStates.get(v) && value.includes(v));
        const all = allValues.filter((v) => !disabledStates.get(v) || value.includes(v));

        // Restart the cycle from a value set from outside, or from a partial selection only the
        // parent's `indeterminate` prop knows about, as with a nested group.
        const lastChange =
          indeterminateProp && !indeterminate ? null : getLastChange(lastChangeRef.current, value);
        const proposed = lastChange?.proposed ?? value;
        const mixed = lastChange?.mixed ?? value;

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

        changeValue(nextValue, mixed, eventDetails);
      },
    }),
    [allValues, changeValue, checked, childIdsState, indeterminate, value],
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

        changeValue(newValue, newValue, eventDetails);
      },
    }),
    [changeValue, value],
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

interface LastChange {
  proposed: string[];
  mixed: string[];
  values: string[][];
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
