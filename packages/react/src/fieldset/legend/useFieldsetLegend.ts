'use client';
import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { useFieldsetRootContext } from '../root/FieldsetRootContext';

export function useFieldsetLegend(params: useFieldsetLegend.Parameters) {
  const { id: idProp } = params;

  const { setLegendId } = useFieldsetRootContext();

  const id = useBaseUiId(idProp);

  useEnhancedEffect(() => {
    setLegendId(id);
    return () => {
      setLegendId(undefined);
    };
  }, [setLegendId, id]);

  const getLegendProps = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps(
        {
          id,
        },
        externalProps,
      ),
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
