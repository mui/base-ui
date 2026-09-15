'use client';
import * as React from 'react';
import type { TransitionStatus } from '../../internals/useTransitionStatus';
import { TooltipStore } from '../store/TooltipStore';

export type TooltipRootContext<Payload = unknown> = TooltipStore<Payload>;

export const TooltipRootContext = React.createContext<TooltipRootContext | undefined>(undefined);

export function useTooltipRootContext(optional?: false): TooltipRootContext;
export function useTooltipRootContext(optional: true): TooltipRootContext | undefined;
export function useTooltipRootContext(optional?: boolean) {
  const context = React.useContext(TooltipRootContext);
  if (context === undefined && !optional) {
    throw new Error(
      'Base UI: TooltipRootContext is missing. Tooltip parts must be placed within <Tooltip.Root>.',
    );
  }

  return context;
}

// Separate contexts preserve subscriptions to individual lifecycle values.
export const TooltipOpenContext = React.createContext(false);
export const TooltipMountedContext = React.createContext(false);
export const TooltipTransitionStatusContext = React.createContext<TransitionStatus>(undefined);
