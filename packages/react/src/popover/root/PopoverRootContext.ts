'use client';
import * as React from 'react';
import type { FloatingTreeType } from '../../utils/popups/floating-root/types';
import type { PopoverStore } from '../store/PopoverStore';

export type PopoverRootContext<Payload = unknown> = PopoverStore<Payload>;

export const PopoverRootContext = React.createContext<PopoverRootContext | undefined>(undefined);

/**
 * The popover's node in the popup tree: its id and the tree the Root registered it in. The Root
 * registers the node; the Positioner attaches its snapshot to the same tree and provides it as the
 * parent of popups nested inside the popover.
 */
export const PopoverTreeNodeContext = React.createContext<{
  id: string | undefined;
  tree: FloatingTreeType | null;
} | null>(null);

export function usePopoverRootContext(optional?: false): PopoverRootContext;
export function usePopoverRootContext(optional: true): PopoverRootContext | undefined;
export function usePopoverRootContext(optional?: boolean) {
  const context = React.useContext(PopoverRootContext);
  if (context === undefined && !optional) {
    throw new Error(
      'Base UI: PopoverRootContext is missing. Popover parts must be placed within <Popover.Root>.',
    );
  }
  return context;
}
