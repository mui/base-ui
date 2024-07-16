import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
/**
 *
 * API:
 *
 * - [useFieldsetRoot API](https://mui.com/base-ui/api/use-fieldset-root/)
 */
export function useFieldsetRoot() {
  const [labelId, setLabelId] = React.useState<string | undefined>(undefined);

  const getRootProps = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps(externalProps, {
        'aria-labelledby': labelId,
      }),
    [labelId],
  );

  return React.useMemo(
    () => ({
      getRootProps,
      labelId,
      setLabelId,
    }),
    [getRootProps, labelId],
  );
}
