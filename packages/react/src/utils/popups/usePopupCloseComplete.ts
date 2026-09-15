'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useOpenChangeComplete } from '../../internals/useOpenChangeComplete';

/**
 * Finishes a popup's close after CSS animations, including when the consumer already
 * removed the popup in a React Transition. Inline compositions that never rendered
 * a popup have no popup lifecycle to finish.
 */
export function usePopupCloseComplete({
  enabled: enabledProp,
  open,
  ref,
  onComplete,
}: {
  enabled: boolean;
  open: boolean;
  ref: React.RefObject<HTMLElement | null>;
  onComplete: () => void;
}) {
  const enabled = enabledProp && !open;
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

  useOpenChangeComplete({ enabled, ref, onComplete: complete });

  React.useEffect(() => {
    if (enabled && !ref.current && hadElementRef.current) {
      complete();
    }
  }, [enabled, ref, complete]);
}
