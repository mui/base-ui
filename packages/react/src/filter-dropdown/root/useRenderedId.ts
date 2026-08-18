'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';

/**
 * Publishes the `id` that landed on the element, which a `render` prop can override.
 *
 * @internal
 */
export function useRenderedId(setId: (id: string | undefined) => void) {
  const elementRef = React.useRef<HTMLElement | null>(null);
  const publish = useStableCallback(() => setId(elementRef.current?.id || undefined));

  const ref = useStableCallback((element: HTMLElement | null) => {
    elementRef.current = element;
  });

  useIsoLayoutEffect(publish);
  useIsoLayoutEffect(() => () => setId(undefined), [setId]);

  return ref;
}
