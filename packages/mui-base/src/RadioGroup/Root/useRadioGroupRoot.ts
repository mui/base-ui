import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useControlled } from '../../utils/useControlled';

interface UseRadioGroupRootParameters {
  disabled?: boolean;
  readOnly?: boolean;
  defaultValue?: string;
  value?: string;
  orientation?: 'horizontal' | 'vertical' | 'both';
}
/**
 *
 * API:
 *
 * - [useRadioGroupRoot API](https://mui.com/base-ui/api/use-radio-group-root/)
 */
export function useRadioGroupRoot(params: UseRadioGroupRootParameters) {
  const { disabled, defaultValue, readOnly, orientation, value: externalValue } = params;

  const [checkedItem, setCheckedItem] = useControlled<string | null>({
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
          let navigated = false;
          switch (orientation) {
            case 'vertical':
              navigated = event.key === 'ArrowUp' || event.key === 'ArrowDown';
              break;
            case 'horizontal':
              navigated = event.key === 'ArrowLeft' || event.key === 'ArrowRight';
              break;
            default:
              navigated = event.key.startsWith('Arrow');
          }

          if (navigated) {
            setTouched(true);
          }
        },
      }),
    [disabled, readOnly, orientation],
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
