'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui-components/utils/useStableCallback';
import { useValueAsRef } from '@base-ui-components/utils/useValueAsRef';
import { useAnimationsFinished } from './useAnimationsFinished';

/**
 * Calls the provided function when the CSS open/close animation or transition completes.
 */
export function useOpenChangeComplete(parameters: useOpenChangeComplete.Parameters) {
  const { enabled = true, open, ref, onComplete: onCompleteParam } = parameters;

  const openRef = useValueAsRef(open);
  const onComplete = useStableCallback(onCompleteParam);
  const runOnceAnimationsFinish = useAnimationsFinished(ref, open);

  React.useEffect(() => {
    if (!enabled) {
      return;
    }

    runOnceAnimationsFinish(() => {
      if (open === openRef.current) {
        onComplete();
      }
    });
  }, [enabled, open, onComplete, runOnceAnimationsFinish, openRef]);
}

export interface UseOpenChangeCompleteParameters {
  /**
   * Whether the hook is enabled.
   * @default true
   */
  enabled?: boolean;
  /**
   * Whether the element is open.
   */
  open?: boolean;
  /**
   * Ref to the element being closed.
   */
  ref: React.RefObject<HTMLElement | null>;
  /**
   * Function to call when the animation completes (or there is no animation).
   */
  onComplete: () => void;
}

export namespace useOpenChangeComplete {
  export type Parameters = UseOpenChangeCompleteParameters;
}
