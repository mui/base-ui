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

  const { setControlId, messageIds, setValidityData } = useFieldRootContext();

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
        'aria-describedby': messageIds.length ? messageIds.join(' ') : undefined,
        onBlur(event) {
          const element = event.currentTarget;
          setValidityData({
            validityState: element.validity,
            validityMessage: element.validationMessage,
            value: element.value,
          });
        },
      }),
    [id, messageIds, setValidityData],
  );

  return React.useMemo(
    () => ({
      getControlProps,
    }),
    [getControlProps],
  );
}
