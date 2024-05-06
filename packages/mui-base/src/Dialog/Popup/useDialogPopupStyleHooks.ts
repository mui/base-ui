import * as React from 'react';
import { getStyleHookProps } from '@base_ui/react/utils/getStyleHookProps';
import { DialogPopupOwnerState } from './DialogPopup.types';

export function useDialogPopupStyleHooks(ownerState: DialogPopupOwnerState) {
  return React.useMemo(() => {
    return getStyleHookProps(ownerState, {
      open: (value) => ({ 'data-state': value ? 'open' : 'closed' }),
    });
  }, [ownerState]);
}
