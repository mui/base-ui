import * as React from 'react';
import { TabOwnerState } from './Tab.types';
import { getStyleHookProps } from '../../utils/getStyleHookProps';

/**
 * @ignore - internal hook.
 */
export function useTabStyleHooks(ownerState: TabOwnerState) {
  return React.useMemo(() => {
    return getStyleHookProps(ownerState);
  }, [ownerState]);
}
