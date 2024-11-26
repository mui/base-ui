'use client';
import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';

export function useFieldsetRoot() {
  const [legendId, setLegendId] = React.useState<string | undefined>(undefined);

  const getRootProps = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps(externalProps, {
        'aria-labelledby': legendId,
      }),
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
