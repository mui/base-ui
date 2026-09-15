'use client';
import * as React from 'react';
import type { TransitionStatus } from '../../internals/useTransitionStatus';
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

// Separate contexts keep consumers of `mounted` from rerendering when only
// `transitionStatus` changes.
export const PopoverOpenContext = React.createContext(false);
export const PopoverMountedContext = React.createContext(false);
export const PopoverTransitionStatusContext = React.createContext<TransitionStatus>(undefined);
