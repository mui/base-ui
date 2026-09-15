'use client';
import * as React from 'react';
import type { PopupLifecycleState } from '../../utils/popups/store';
import type { PopoverStore } from '../store/PopoverStore';

export type PopoverRootContext<Payload = unknown> = PopoverStore<Payload>;

export const PopoverRootContext = React.createContext<PopoverRootContext | undefined>(undefined);

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

export const PopoverLifecycleContext = React.createContext<PopupLifecycleState>({
  open: false,
  mounted: false,
  transitionStatus: undefined,
});
