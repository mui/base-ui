import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useControlled } from '../../utils/useControlled';

/**
 *
 * API:
 *
 * - [useRadioGroupRoot API](https://mui.com/base-ui/api/use-radio-group-root/)
 */
export function useRadioGroupRoot(params: useRadioGroupRoot.Parameters) {
  const { disabled, defaultValue, readOnly, value: externalValue } = params;

  const [checkedItem, setCheckedItem] = useControlled<string | number | undefined>({
    controlled: externalValue,
    default: defaultValue,
    name: 'RadioGroup',
    state: 'value',
  });

  const [touched, setTouched] = React.useState(false);

  const getRootProps = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps<'div'>(externalProps, {
        role: 'radiogroup',
        'aria-disabled': disabled || undefined,
        'aria-readonly': readOnly || undefined,
        onKeyDownCapture(event) {
          if (event.key.startsWith('Arrow')) {
            setTouched(true);
          }
        },
      }),
    [disabled, readOnly],
  );

  return React.useMemo(
    () => ({
      getRootProps,
      checkedItem,
      setCheckedItem,
      touched,
      setTouched,
    }),
    [getRootProps, checkedItem, setCheckedItem, touched],
  );
}

namespace useRadioGroupRoot {
  export interface Parameters {
    disabled?: boolean;
    readOnly?: boolean;
    defaultValue?: string | number;
    value?: string | number;
  }
}
