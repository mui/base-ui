import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useId } from '../../utils/useId';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { useFieldsetRootContext } from '../Root/FieldsetRootContext';

interface UseFieldsetRootParameters {
  id?: string;
}
/**
 *
 * API:
 *
 * - [useFieldsetLabel API](https://mui.com/base-ui/api/use-fieldset-label/)
 */
export function useFieldsetLabel(params: UseFieldsetRootParameters) {
  const { id: idProp } = params;

  const { setLabelId } = useFieldsetRootContext();

  const id = useId(idProp);

  useEnhancedEffect(() => {
    setLabelId(id);
    return () => {
      setLabelId(undefined);
    };
  }, [setLabelId, id]);

  const getLabelProps = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps(externalProps, {
        id,
      }),
    [id],
  );

  return React.useMemo(
    () => ({
      getLabelProps,
    }),
    [getLabelProps],
  );
}
