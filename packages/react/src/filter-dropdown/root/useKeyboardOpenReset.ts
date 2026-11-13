'use client';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useTimeout } from '@base-ui/utils/useTimeout';

interface KeyboardOpenStore {
  select: (key: 'open') => boolean;
  set: (key: 'keyboardOpen', value: boolean) => void;
}

/**
 * A keyboard open is recorded with the open request, so a controlled close that bypasses it, or a
 * controlled `open` that ignores it, must not leave the next programmatic open looking like one.
 * An ignored request is cleared a task later, once a controlled `open` prop could have caught up
 * with it.
 */
export function useKeyboardOpenReset(
  store: KeyboardOpenStore,
  open: boolean,
  keyboardOpen: boolean,
) {
  const timeout = useTimeout();
  useIsoLayoutEffect(() => {
    if (!open) {
      store.set('keyboardOpen', false);
    }
  }, [open, store]);
  useIsoLayoutEffect(() => {
    if (open || !keyboardOpen) {
      return;
    }
    timeout.start(0, () => {
      if (!store.select('open')) {
        store.set('keyboardOpen', false);
      }
    });
  }, [open, keyboardOpen, store, timeout]);
}
