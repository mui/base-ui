'use client';
import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps.js';
import { useId } from '../../utils/useId.js';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect.js';
import { useFieldRootContext } from '../Root/FieldRootContext.js';

export function useFieldError(params: useFieldError.Parameters) {
  const { id: idProp, rendered, formError } = params;

  const { setMessageIds, validityData } = useFieldRootContext();

  const id = useId(idProp);

  useEnhancedEffect(() => {
    if (!rendered || !id) {
      return undefined;
    }

    setMessageIds((v) => v.concat(id));

    return () => {
      setMessageIds((v) => v.filter((item) => item !== id));
    };
  }, [rendered, id, setMessageIds]);

  const getErrorProps = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps<'span'>(externalProps, {
        id,
        children:
          formError ||
          (validityData.errors.length > 1
            ? React.createElement(
                'ul',
                {},
                validityData.errors.map((message) =>
                  React.createElement('li', { key: message }, message),
                ),
              )
            : validityData.error),
      }),
    [id, formError, validityData],
  );

  return React.useMemo(
    () => ({
      getErrorProps,
    }),
    [getErrorProps],
  );
}

export namespace useFieldError {
  export interface Parameters {
    id: string | undefined;
    rendered: boolean;
    formError: string | string[] | null;
  }
}
