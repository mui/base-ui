'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useAnimationsFinished } from '../../internals/useAnimationsFinished';

/**
 * Finishes a popup's close after CSS animations, including when the consumer already
 * removed the popup in a React Transition. Inline compositions that never rendered
 * a popup have no popup lifecycle to finish.
 */
export function usePopupCloseComplete({
  enabled,
  open,
  ref,
  onComplete,
}: {
  enabled: boolean;
  open: boolean;
  ref: React.RefObject<HTMLElement | null>;
  onComplete: () => void;
}) {
  const hadElementRef = React.useRef(false);
  useIsoLayoutEffect(() => {
    if (open && ref.current) {
      hadElementRef.current = true;
    }
  });

  const complete = useStableCallback(() => {
    if (!open) {
      hadElementRef.current = false;
      onComplete();
    }
  });
  const runOnceAnimationsFinish = useAnimationsFinished(ref);

  React.useEffect(() => {
    if (!enabled || open) {
      return undefined;
    }

    if (!ref.current) {
      if (hadElementRef.current) {
        complete();
      }
      return undefined;
    }

    const abortController = new AbortController();
    runOnceAnimationsFinish(complete, abortController.signal);
    return () => abortController.abort();
  }, [enabled, open, ref, complete, runOnceAnimationsFinish]);
}
