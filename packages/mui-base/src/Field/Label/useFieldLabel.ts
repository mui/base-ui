import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';

interface UseFieldLabelParameters {
  controlId: string | undefined;
}
/**
 *
 * API:
 *
 * - [useFieldLabel API](https://mui.com/base-ui/api/use-field-label/)
 */
export function useFieldLabel(params: UseFieldLabelParameters) {
  const { controlId } = params;

  const getLabelProps = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps<'label'>(externalProps, {
        htmlFor: controlId,
        onMouseDown: (e) => e.preventDefault(),
        ...externalProps,
      }),
    [controlId],
  );

  return React.useMemo(
    () => ({
      getLabelProps,
    }),
    [getLabelProps],
  );
}
