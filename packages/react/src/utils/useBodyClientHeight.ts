import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui-components/utils/useIsoLayoutEffect';
import { useEventCallback } from '@base-ui-components/utils/useEventCallback';
import { ownerWindow, ownerDocument } from '@base-ui-components/utils/owner';
import { SCROLL_LOCK_ATTRIBUTE } from './useScrollLock';

export function useBodyClientHeight(ref: React.RefObject<Element | null>, open: boolean) {
  const [bodyClientHeight, setBodyClientHeight] = React.useState(0);

  const measure = useEventCallback(() => {
    const doc = ownerDocument(ref.current);
    // This will be the viewport height, not the body height, if the scroll is locked.
    if (doc.documentElement.hasAttribute(SCROLL_LOCK_ATTRIBUTE)) {
      return;
    }
    setBodyClientHeight(Math.max(doc.body.clientHeight, doc.documentElement.clientHeight));
  });

  useIsoLayoutEffect(measure, [measure, open]);

  React.useEffect(() => {
    if (!open) {
      return undefined;
    }

    const win = ownerWindow(ref.current);
    win.addEventListener('resize', measure);
    win.addEventListener('orientationchange', measure);
    win.addEventListener('scroll', measure, { passive: true });

    return () => {
      win.removeEventListener('resize', measure);
      win.removeEventListener('orientationchange', measure);
      win.removeEventListener('scroll', measure);
    };
  }, [open, ref, measure]);

  return bodyClientHeight;
}
