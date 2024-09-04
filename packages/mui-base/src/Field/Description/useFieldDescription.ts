'use client';

import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useId } from '../../utils/useId';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { useFieldRootContext } from '../Root/FieldRootContext';

interface UseFieldDescriptionParameters {
  id: string | undefined;
}

/**
 *
 * API:
 *
 * - [useFieldDescription API](https://mui.com/base-ui/api/use-field-description/)
 */
export function useFieldDescription(params: UseFieldDescriptionParameters) {
  const { id: idProp } = params;

  const { setMessageIds } = useFieldRootContext();

  const id = useId(idProp);

  useEnhancedEffect(() => {
    if (!id) {
      return undefined;
    }

    setMessageIds((v) => v.concat(id));

    return () => {
      setMessageIds((v) => v.filter((item) => item !== id));
    };
  }, [id, setMessageIds]);

  const getDescriptionProps = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps<'span'>(externalProps, {
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
