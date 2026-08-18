'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';

/**
 * Publishes the `id` that landed on an element after `render` prop merging.
 *
 * @internal
 */
export function useRenderedId(
  setId: (id: string | undefined) => void,
  fallbackId: string | undefined,
  hasExplicitId: boolean,
) {
  const elementRef = React.useRef<HTMLElement | null>(null);
  const publish = useStableCallback(() => {
    const renderedId = elementRef.current?.id || undefined;
    // Do not publish the generated fallback back as an override. Otherwise removing an explicit
    // id leaves the old override as its own fallback and it can never return to the generated id.
    setId(hasExplicitId || renderedId !== fallbackId ? renderedId : undefined);
  });

  const ref = useStableCallback((element: HTMLElement | null) => {
    elementRef.current = element;
  });

  useIsoLayoutEffect(publish);
  useIsoLayoutEffect(() => () => setId(undefined), [setId]);

  return ref;
}
