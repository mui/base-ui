'use client';
import * as React from 'react';
import { mergeProps } from '../../utils/mergeProps';

export function useFieldsetRoot() {
  const [legendId, setLegendId] = React.useState<string | undefined>(undefined);

  const getRootProps = React.useCallback(
    (externalProps = {}) =>
      mergeProps(
        {
          'aria-labelledby': legendId,
        },
        externalProps,
      ),
    [legendId],
  );

  return React.useMemo(
    () => ({
      getRootProps,
      legendId,
      setLegendId,
    }),
    [getRootProps, legendId],
  );
}
