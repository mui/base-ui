import * as React from 'react';
import { useId } from '../../utils/useId';
import { useEventCallback } from '../../utils/useEventCallback';

/**
 *
 * API:
 *
 * - [useCheckboxGroupParent API](https://mui.com/base-ui/api/use-checkbox-group-parent/)
 */
export function useCheckboxGroupParent(
  params: UseCheckboxGroupParent.Parameters,
): UseCheckboxGroupParent.ReturnValue {
  const {
    allValues = [],
    value = [],
    onValueChange: onValueChangeProp = () => {},
    preserveChildStates = false,
  } = params;

  const uncontrolledStateRef = React.useRef(value);
  const [status, setStatus] = React.useState<'on' | 'off' | 'mixed'>('mixed');

  const id = useId();
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
        const allOnOrOff =
          uncontrolledState.length === allValues.length || uncontrolledState.length === 0;

        if (allOnOrOff) {
          if (value.length === allValues.length) {
            onValueChange([], event);
          } else {
            onValueChange(allValues, event);
          }
          return;
        }

        if (preserveChildStates) {
          if (status === 'mixed') {
            onValueChange(allValues, event);
            setStatus('on');
          } else if (status === 'on') {
            onValueChange([], event);
            setStatus('off');
          } else if (status === 'off') {
            onValueChange(uncontrolledState, event);
            setStatus('mixed');
          }
        } else if (checked) {
          onValueChange([], event);
          setStatus('off');
        } else {
          onValueChange(allValues, event);
          setStatus('on');
        }
      },
    }),
    [
      allValues,
      checked,
      id,
      indeterminate,
      onValueChange,
      preserveChildStates,
      status,
      value.length,
    ],
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
    }),
    [id, indeterminate, getParentProps, getChildProps],
  );
}

export namespace UseCheckboxGroupParent {
  export interface Parameters {
    allValues?: string[];
    value?: string[];
    onValueChange?: (value: string[], event: Event) => void;
    preserveChildStates?: boolean;
  }

  export interface ReturnValue {
    id: string | undefined;
    indeterminate: boolean;
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
