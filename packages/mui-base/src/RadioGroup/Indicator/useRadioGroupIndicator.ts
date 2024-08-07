import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
/**
 *
 * API:
 *
 * - [useRadioGroupIndicator API](https://mui.com/base-ui/api/use-radio-group-indicator/)
 */
export function useRadioGroupIndicator() {
  const getIndicatorProps = React.useCallback(
    (externalProps = {}) => mergeReactProps<'span'>(externalProps, {}),
    [],
  );

  return React.useMemo(
    () => ({
      getIndicatorProps,
    }),
    [getIndicatorProps],
  );
}
