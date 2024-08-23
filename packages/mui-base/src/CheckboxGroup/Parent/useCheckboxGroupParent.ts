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
  const { allValues = [], value = [], onValueChange: onValueChangeProp = () => {} } = params;

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
      onCheckedChange() {
        const uncontrolledState = uncontrolledStateRef.current;
        const allOnOrOff =
          uncontrolledState.length === allValues.length || uncontrolledState.length === 0;

        if (allOnOrOff) {
          if (value.length === allValues.length) {
            onValueChange([]);
          } else {
            onValueChange(allValues);
          }
          return;
        }

        if (status === 'mixed') {
          onValueChange(allValues);
          setStatus('on');
        } else if (status === 'on') {
          onValueChange([]);
          setStatus('off');
        } else if (status === 'off') {
          onValueChange(uncontrolledState);
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
      onCheckedChange(nextChecked) {
        const newValue = [...value];
        if (nextChecked) {
          newValue.push(name);
        } else {
          newValue.splice(newValue.indexOf(name), 1);
        }
        uncontrolledStateRef.current = newValue;
        onValueChange(newValue);
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
    onValueChange?: (value: string[]) => void;
  }
  export interface ReturnValue {
    id: string | undefined;
    indeterminate: boolean;
    getParentProps: () => {
      id: string | undefined;
      indeterminate: boolean;
      checked: boolean;
      'aria-controls': string;
      onCheckedChange: (checked: boolean) => void;
    };
    getChildProps: (name: string) => {
      name: string;
      id: string;
      checked: boolean;
      onCheckedChange: (checked: boolean) => void;
    };
  }
}
