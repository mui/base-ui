'use client';
import * as React from 'react';
import type { useCollapsibleRoot } from './useCollapsibleRoot';
import type { CollapsibleRoot } from './CollapsibleRoot';
import type { TransitionStatus } from '../../utils/useTransitionStatus';

export interface CollapsibleRootContext extends useCollapsibleRoot.ReturnValue {
  onOpenChange: (open: boolean, eventDetails: CollapsibleRoot.ChangeEventDetails) => void;
  state: CollapsibleRoot.State;
  transitionStatus: TransitionStatus;
}

export const CollapsibleRootContext = React.createContext<CollapsibleRootContext | undefined>(
  undefined,
);

export function useCollapsibleRootContext() {
  const context = React.useContext(CollapsibleRootContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: CollapsibleRootContext is missing. Collapsible parts must be placed within <Collapsible.Root>.',
    );
  }

  return context;
}
