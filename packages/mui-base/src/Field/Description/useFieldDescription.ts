'use client';
import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps.js';
import { useId } from '../../utils/useId.js';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect.js';
import { useFieldRootContext } from '../Root/FieldRootContext.js';

export function useFieldDescription(params: useFieldDescription.Parameters) {
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

export namespace useFieldDescription {
  export interface Parameters {
    id: string | undefined;
  }
}
