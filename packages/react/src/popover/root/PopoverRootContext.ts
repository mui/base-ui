'use client';
import * as React from 'react';
import type { BaseOpenChangeReason } from '../../utils/translateOpenChangeReason';
import type { PopoverStore } from '../store';

export type PopoverOpenChangeReason = BaseOpenChangeReason | 'close-press';

export interface PopoverRootContext {
  setOpen: (
    open: boolean,
    event: Event | undefined,
    reason: PopoverOpenChangeReason | undefined,
    triggerElement: Element | undefined,
    data?: unknown,
  ) => void;
  popupRef: React.RefObject<HTMLElement | null>;
  onOpenChangeComplete: ((open: boolean) => void) | undefined;
  store: PopoverStore;
}

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
