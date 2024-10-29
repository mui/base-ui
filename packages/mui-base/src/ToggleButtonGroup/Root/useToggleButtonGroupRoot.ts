'use client';
import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useControlled } from '../../utils/useControlled';
import { useEventCallback } from '../../utils/useEventCallback';
import type { GenericHTMLProps } from '../../utils/types';

export function useToggleButtonGroupRoot(
  parameters: UseToggleButtonGroupRoot.Parameters,
): UseToggleButtonGroupRoot.ReturnValue {
  const {
    value,
    defaultValue,
    direction = 'ltr',
    disabled = false,
    onValueChange,
    toggleMultiple = false,
  } = parameters;

  const [groupValue, setValueState] = useControlled({
    controlled: value,
    default: defaultValue,
    name: 'ToggleButtonGroup',
    state: 'value',
  });

  const setGroupValue = useEventCallback(
    (newValue: unknown, nextPressed: boolean, event: Event) => {
      let newGroupValue: unknown[] | undefined;
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
    },
  );

  const getRootProps = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps<'div'>(externalProps, {
        role: 'group',
        dir: direction,
      }),
    [direction],
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

export namespace UseToggleButtonGroupRoot {
  export type Direction = 'ltr' | 'rtl';

  export interface Parameters {
    value?: unknown[];
    defaultValue?: unknown[];
    onValueChange?: (groupValue: unknown[], event: Event) => void;
    /**
     * When `true` the component is disabled
     * @false
     */
    disabled?: boolean;
    /**
     * When `false` only one ToggleButton in the group can be pressed.
     * When a ToggleButton is pressed, the others in the group will become unpressed
     * @default false
     */
    toggleMultiple?: boolean;
    /**
     * Text direction
     * @default 'ltr'
     */
    direction?: Direction;
  }

  export interface ReturnValue {
    getRootProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
    /**
     * When `true` the component is disabled
     * @false
     */
    disabled: boolean;
    /**
     *
     */
    setGroupValue: (newValue: unknown, nextPressed: boolean, event: Event) => void;
    /**
     * The value of the ToggleButtonGroup represented by an array of values
     * of the items that are pressed
     */
    value: unknown[];
  }
}
