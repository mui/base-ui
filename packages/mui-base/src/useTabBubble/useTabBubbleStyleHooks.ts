import * as React from 'react';
import { TabBubbleOwnerState } from '../Tabs/TabBubble/TabBubble.types';
import { getStyleHookProps } from '../utils/getStyleHookProps';

// eslint-disable-next-line react/function-component-definition
const NOOP = () => null;

/**
 * @ignore - internal hook.
 */
export function useTabBubbleStyleHooks(ownerState: TabBubbleOwnerState) {
  return React.useMemo(() => {
    // @ts-ignore The non-stringifyable value of the ownerState is excluded below
    return getStyleHookProps(ownerState, {
      direction: NOOP,
      selectedTabPosition: NOOP,
    });
  }, [ownerState]);
}
