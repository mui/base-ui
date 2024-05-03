import * as React from 'react';
import { type DialogRootOwnerState } from './DialogRoot.types';
import { getStyleHookProps } from '../../utils/getStyleHookProps';

/**
 * @ignore - internal hook.
 */
export function useDialogRootStyleHooks(ownerState: DialogRootOwnerState) {
  return React.useMemo(() => {
    return getStyleHookProps(ownerState, {
      open: (value) => ({ 'data-state': value ? 'open' : 'closed' }),
    });
  }, [ownerState]);
}
