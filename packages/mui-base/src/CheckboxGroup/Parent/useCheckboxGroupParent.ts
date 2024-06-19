import * as React from 'react';
import type {
  UseCheckboxGroupParentParameters,
  UseCheckboxGroupParentReturnValue,
} from './useCheckboxGroupParent.types';
import { useId } from '../../utils/useId';
import { useEventCallback } from '../../utils/useEventCallback';

/**
 *
 * API:
 *
 * - [useCheckboxGroupParent API](https://mui.com/base-ui/api/use-checkbox-group-parent/)
 */
export function useCheckboxGroupParent(
  params: UseCheckboxGroupParentParameters,
): UseCheckboxGroupParentReturnValue {
  const { allValues = [], value = [], onValueChange: onValueChangeProp = () => {} } = params;

  const uncontrolledStateRef = React.useRef(value);
  const [status, setStatus] = React.useState<'on' | 'off' | 'mixed'>('mixed');

  const id = useId();
  const checked = value.length === allValues.length;
  const indeterminate = value.length !== allValues.length && value.length > 0;

  const onValueChange = useEventCallback(onValueChangeProp);

  const getParentProps = React.useCallback(
    () => ({
      id,
      indeterminate,
      checked,
      'aria-controls': allValues.map((v) => `${id}-${v}`).join(' '),
      onChange() {
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

  const getChildProps = React.useCallback(
    (name: string) => ({
      name,
      id: `${id}-${name}`,
      checked: value.includes(name),
      onChange(event: React.ChangeEvent<HTMLInputElement>) {
        const newValue = [...value];
        if (event.target.checked) {
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
