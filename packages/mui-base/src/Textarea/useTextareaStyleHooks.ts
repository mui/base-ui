import * as React from 'react';
import { TextareaOwnerState } from './Textarea.types';
import { getStyleHookProps } from './utils';

export function useTextareaStyleHooks(ownerState: TextareaOwnerState) {
  return React.useMemo(() => {
    return getStyleHookProps(ownerState, {
      formControlContext: (value) => (!value ? null : { 'data-formcontrol': 'true' }),
    });
  }, [ownerState]);
}
