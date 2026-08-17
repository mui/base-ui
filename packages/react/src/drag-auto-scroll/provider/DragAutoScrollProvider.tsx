'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { retainScrollMonitor } from '../../utils/drag-and-drop/autoScroller';

/**
 * Enables inferred auto-scroll for every drag source managed by Base UI.
 * Renders no element.
 *
 * Scrollable containers do not need to be registered individually. Use
 * `DragAutoScroll.Root` only to configure a particular region or drive a custom
 * scrolling surface.
 *
 * Documentation: [Base UI Drag Auto Scroll](https://base-ui.com/react/components/drag-auto-scroll)
 */
export function DragAutoScrollProvider(props: DragAutoScrollProvider.Props): React.ReactNode {
  const { children, disabled = false } = props;

  useIsoLayoutEffect(() => {
    if (disabled) {
      return undefined;
    }
    return retainScrollMonitor();
  }, [disabled]);

  return children;
}

export interface DragAutoScrollProviderProps {
  /** The application subtree rendered by this provider. */
  children?: React.ReactNode | undefined;
  /** Whether this provider's inferred auto-scroll activation is disabled. @default false */
  disabled?: boolean | undefined;
}

export namespace DragAutoScrollProvider {
  export type Props = DragAutoScrollProviderProps;
}
