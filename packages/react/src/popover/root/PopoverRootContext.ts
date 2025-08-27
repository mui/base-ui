'use client';
import * as React from 'react';
import type { PopoverStore } from '../store';
import { PopoverRoot } from './PopoverRoot';

export interface PopoverRootContext {
  setOpen: (
    open: boolean,
    eventDetails: PopoverRoot.ChangeEventDetails,
    target: HTMLElement | undefined,
  ) => void;
  popupRef: React.RefObject<HTMLElement | null>;
  backdropRef: React.RefObject<HTMLDivElement | null>;
  internalBackdropRef: React.RefObject<HTMLDivElement | null>;
  onOpenChangeComplete: ((open: boolean) => void) | undefined;
  store: PopoverStore<unknown>;
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
