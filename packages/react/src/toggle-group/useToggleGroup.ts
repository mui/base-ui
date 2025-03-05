'use client';
import * as React from 'react';
import { mergeProps } from '../utils/mergeProps';
import { useControlled } from '../utils/useControlled';
import { useEventCallback } from '../utils/useEventCallback';
import type { GenericHTMLProps } from '../utils/types';

export function useToggleGroup(parameters: useToggleGroup.Parameters): useToggleGroup.ReturnValue {
  const { value, defaultValue, disabled, onValueChange, toggleMultiple } = parameters;

  const [groupValue, setValueState] = useControlled({
    controlled: value,
    default: defaultValue,
    name: 'ToggleGroup',
    state: 'value',
  });

  const setGroupValue = useEventCallback((newValue: string, nextPressed: boolean, event: Event) => {
    let newGroupValue: any[] | undefined;
    if (toggleMultiple) {
      newGroupValue = groupValue.slice();
      if (nextPressed) {
        newGroupValue.push(newValue);
      } else {
        newGroupValue.splice(groupValue.indexOf(newValue), 1);
      }
    } else {
      newGroupValue = nextPressed ? [newValue] : [];
    }
    if (Array.isArray(newGroupValue)) {
      setValueState(newGroupValue);
      onValueChange?.(newGroupValue, event);
    }
  });

  const getRootProps = React.useCallback(
    (externalProps = {}) =>
      mergeProps<'div'>(
        {
          role: 'group',
        },
        externalProps,
      ),
    [],
  );

  return React.useMemo(
    () => ({
      getRootProps,
      disabled,
      setGroupValue,
      value: groupValue,
    }),
    [getRootProps, disabled, groupValue, setGroupValue],
  );
}

export type ToggleGroupOrientation = 'horizontal' | 'vertical';

export namespace useToggleGroup {
  export interface Parameters {
    /**
     * The open state of the ToggleGroup represented by an array of
     * the values of all pressed `<ToggleGroup.Item/>`s
     * This is the controlled counterpart of `defaultValue`.
     */
    value?: readonly any[];
    /**
     * The open state of the ToggleGroup represented by an array of
     * the values of all pressed `<ToggleGroup.Item/>`s.
     * This is the uncontrolled counterpart of `value`.
     */
    defaultValue?: readonly any[];
    /**
     * Callback fired when the pressed states of the ToggleGroup changes.
     *
     * @param {any[]} groupValue An array of the `value`s of all the pressed items.
     * @param {Event} event The corresponding event that initiated the change.
     */
    onValueChange: (groupValue: any[], event: Event) => void;
    /**
     * Whether the component should ignore user interaction.
     * @default false
     */
    disabled: boolean;
    /**
     * When `false` only one item in the group can be pressed. If any item in
     * the group becomes pressed, the others will become unpressed.
     * When `true` multiple items can be pressed.
     * @default false
     */
    toggleMultiple: boolean;
  }

  export interface ReturnValue {
    getRootProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
    /**
     * Whether the component should ignore user interaction.
     * @default false
     */
    disabled: boolean;
    /**
     *
     */
    setGroupValue: (newValue: string, nextPressed: boolean, event: Event) => void;
    /**
     * The value of the ToggleGroup represented by an array of values
     * of the items that are pressed.
     */
    value: readonly any[];
  }
}
