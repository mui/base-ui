import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useId } from '../../utils/useId';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';

interface UseFieldDescriptionParameters {
  id: string | undefined;
  setDescriptionId: React.Dispatch<React.SetStateAction<string | undefined>>;
}
/**
 *
 * API:
 *
 * - [useFieldDescription API](https://mui.com/base-ui/api/use-field-description/)
 */
export function useFieldDescription(params: UseFieldDescriptionParameters) {
  const { setDescriptionId, id: idProp } = params;

  const id = useId(idProp);

  useEnhancedEffect(() => {
    setDescriptionId(id);
    return () => {
      setDescriptionId(undefined);
    };
  }, [id, setDescriptionId]);

  const getDescriptionProps = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps<'p'>(externalProps, {
        id,
      }),
    [id],
  );

  return React.useMemo(
    () => ({
      getDescriptionProps,
    }),
    [getDescriptionProps],
  );
}
