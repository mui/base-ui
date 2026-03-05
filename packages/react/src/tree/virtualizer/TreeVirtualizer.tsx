'use client';
import * as React from 'react';

/**
 * Stub virtualizer component for the tree.
 * Currently renders all items without virtualization.
 * This component exists as a placeholder for future virtualization support.
 */
export function TreeVirtualizer(props: TreeVirtualizer.Props) {
  return <React.Fragment>{props.children}</React.Fragment>;
}

export interface TreeVirtualizerProps {
  children: React.ReactNode;
}

export namespace TreeVirtualizer {
  export type Props = TreeVirtualizerProps;
}
