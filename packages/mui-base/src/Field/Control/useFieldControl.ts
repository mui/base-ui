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

  const { name, setControlId, messageIds, validityData, setValidityData, disabled, validate } =
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
        name,
        'aria-describedby': messageIds.length ? messageIds.join(' ') : undefined,
        'aria-invalid': !validityData.state.valid ? 'true' : undefined,
        async onBlur(event) {
          const element = event.currentTarget;

          const nextValidityData = {
            state: element.validity,
            message: '',
            value: element.value,
          };

          setValidityData(nextValidityData);
          element.setCustomValidity('');

          const result = await validate(element.value);

          element.setCustomValidity(result !== null ? result : '');

          setValidityData({
            ...nextValidityData,
            message: result ?? element.validationMessage,
          });
        },
      }),
    [id, disabled, name, messageIds, validityData.state.valid, validate, setValidityData],
  );

  return React.useMemo(
    () => ({
      getControlProps,
    }),
    [getControlProps],
  );
}
