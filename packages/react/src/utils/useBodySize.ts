import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui-components/utils/useIsoLayoutEffect';
import { useEventCallback } from '@base-ui-components/utils/useEventCallback';
import { ownerWindow, ownerDocument } from '@base-ui-components/utils/owner';
import { SCROLL_LOCK_ATTRIBUTE } from './useScrollLock';

export interface BodySize {
  width: number;
  height: number;
}

const INITIAL_BODY_SIZE = { width: 0, height: 0 } as const;

export function useBodySize(ref: React.RefObject<Element | null>, open: boolean): BodySize {
  const [bodySize, setBodySize] = React.useState<BodySize>(INITIAL_BODY_SIZE);

  const measure = useEventCallback(() => {
    const doc = ownerDocument(ref.current);

    // This will be the viewport dimensions, not the body size, if the scroll is locked.
    if (doc.documentElement.hasAttribute(SCROLL_LOCK_ATTRIBUTE)) {
      return;
    }

    const nextBodySize: BodySize = {
      // Firefox can create a horizontal scrollbar even if the body does not overflow.
      width: Math.max(doc.body.scrollWidth, doc.documentElement.scrollWidth) - 0.5,
      height: Math.max(doc.body.clientHeight, doc.documentElement.clientHeight),
    };

    setBodySize((prevBodySize) => {
      return prevBodySize.width === nextBodySize.width &&
        prevBodySize.height === nextBodySize.height
        ? prevBodySize
        : nextBodySize;
    });
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

  return bodySize;
}
