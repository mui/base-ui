import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { useId } from '../../utils/useId';
import { useFieldRootContext } from '../Root/FieldRootContext';

interface UseFieldControlParameters {
  id?: string;
}

/**
 *
 * API:
 *
 * - [useFieldControl API](https://mui.com/base-ui/api/use-field-control/)
 */
export function useFieldControl(params: UseFieldControlParameters) {
  const { id: idProp } = params;

  const { setControlId, messageIds, validityData, setValidityData, disabled, validate } =
    useFieldRootContext();

  const id = useId(idProp);

  useEnhancedEffect(() => {
    setControlId(id);
    return () => {
      setControlId(undefined);
    };
  }, [id, setControlId]);

  const getControlProps = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps<'input'>(externalProps, {
        id,
        disabled,
        'aria-describedby': messageIds.length ? messageIds.join(' ') : undefined,
        'aria-invalid': !validityData.validityState.valid ? 'true' : undefined,
        async onBlur(event) {
          const element = event.currentTarget;
          const result = await validate(element.value);

          if (result !== null) {
            element.setCustomValidity(result);
          } else {
            element.setCustomValidity('');
          }

          setValidityData({
            validityState: element.validity,
            validityMessage: result ?? element.validationMessage,
            value: element.value,
          });
        },
      }),
    [id, disabled, messageIds, validityData.validityState.valid, validate, setValidityData],
  );

  return React.useMemo(
    () => ({
      getControlProps,
    }),
    [getControlProps],
  );
}
