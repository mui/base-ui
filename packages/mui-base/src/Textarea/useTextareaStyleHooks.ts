import * as React from 'react';
import { TextareaOwnerState } from './Textarea.types';
import { getStyleHookProps } from './utils';
/**
 *
 * API:
 *
 * - [useTextareaStyleHooks API](https://mui.com/base-ui/api/use-textarea-style-hooks/)
 */
export function useTextareaStyleHooks(ownerState: TextareaOwnerState) {
  return React.useMemo(() => {
    return getStyleHookProps(ownerState, {
      formControlContext: (value) => (!value ? null : { 'data-formcontrol': 'true' }),
    });
  }, [ownerState]);
}
