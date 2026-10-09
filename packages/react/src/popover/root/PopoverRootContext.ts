'use client';
import * as React from 'react';
import type { PopoverStore } from '../store/PopoverStore';

export type PopoverRootContext<Payload = unknown> = PopoverStore<Payload>;

export const PopoverRootContext = React.createContext<PopoverRootContext | undefined>(undefined);

/**
 * The id of the popover's node in the popup tree. The Root registers the node; the Positioner
 * provides it as the parent of popups nested inside the popover.
 */
export const PopoverTreeNodeIdContext = React.createContext<string | undefined>(undefined);

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
