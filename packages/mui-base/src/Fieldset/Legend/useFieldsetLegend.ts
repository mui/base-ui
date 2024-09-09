import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useId } from '../../utils/useId';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { useFieldsetRootContext } from '../Root/FieldsetRootContext';

interface UseFieldsetLegendParameters {
  id?: string;
}

export function useFieldsetLegend(params: UseFieldsetLegendParameters) {
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
