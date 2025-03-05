'use client';
import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { useFieldRootContext } from '../root/FieldRootContext';

export function useFieldDescription(params: useFieldDescription.Parameters) {
  const { id: idProp } = params;

  const { setMessageIds } = useFieldRootContext();

  const id = useBaseUiId(idProp);

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
      mergeReactProps<'span'>(
        {
          id,
        },
        externalProps,
      ),
    [id],
  );

  return React.useMemo(
    () => ({
      getDescriptionProps,
    }),
    [getDescriptionProps],
  );
}

export namespace useFieldDescription {
  export interface Parameters {
    id: string | undefined;
  }
}
