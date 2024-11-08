'use client';
import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps.js';
import { useId } from '../../utils/useId.js';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect.js';
import { useFieldsetRootContext } from '../Root/FieldsetRootContext.js';

export function useFieldsetLegend(params: useFieldsetLegend.Parameters) {
  const { id: idProp } = params;

  const { setLegendId } = useFieldsetRootContext();

  const id = useId(idProp);

  useEnhancedEffect(() => {
    setLegendId(id);
    return () => {
      setLegendId(undefined);
    };
  }, [setLegendId, id]);

  const getLegendProps = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps(externalProps, {
        id,
      }),
    [id],
  );

  return React.useMemo(
    () => ({
      getLegendProps,
    }),
    [getLegendProps],
  );
}

export namespace useFieldsetLegend {
  export interface Parameters {
    id?: string;
  }
}
