import * as React from 'react';
import { mergeReactProps } from '../utils/mergeReactProps';
/**
 *
 * API:
 *
 * - [useLabel API](https://mui.com/base-ui/api/use-label/)
 */
export function useLabel() {
  const getLabelProps = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps<'label'>(externalProps, {
        onMouseDown(e) {
          e.preventDefault();
        },
      }),
    [],
  );

  return React.useMemo(
    () => ({
      getLabelProps,
    }),
    [getLabelProps],
  );
}
