'use client';
import * as React from 'react';
import { mergeProps } from '../../merge-props';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useLayoutEffect } from '../../utils/useLayoutEffect';
import { useFieldsetRootContext } from '../root/FieldsetRootContext';

export function useFieldsetLegend(params: useFieldsetLegend.Parameters) {
  const { id: idProp } = params;

  const { setLegendId } = useFieldsetRootContext();

  const id = useBaseUiId(idProp);

  useLayoutEffect(() => {
    setLegendId(id);
    return () => {
      setLegendId(undefined);
    };
  }, [setLegendId, id]);

  const getLegendProps = React.useCallback(
    (externalProps = {}) =>
      mergeProps(
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
