'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { visuallyHidden } from '@base-ui/utils/visuallyHidden';

interface ClosePartStore {
  state: {
    closePartCount: number;
  };
  set: (selector: 'closePartCount', value: number) => void;
}

export function useClosePartRegistration(store: ClosePartStore | undefined) {
  useIsoLayoutEffect(() => {
    if (!store) {
      return undefined;
    }

    store.set('closePartCount', store.state.closePartCount + 1);

    return () => {
      store.set('closePartCount', Math.max(0, store.state.closePartCount - 1));
    };
  }, [store]);
}

export function getCloseButtonStyle(isVisuallyHidden: boolean): React.CSSProperties | undefined {
  return isVisuallyHidden ? visuallyHidden : undefined;
}
