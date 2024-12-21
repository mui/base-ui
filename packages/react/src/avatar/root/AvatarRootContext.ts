'use client';
import * as React from 'react';
import type { AvatarRoot } from './AvatarRoot';
import type { useAvatarRoot } from './useAvatarRoot';

export interface AvatarRootContext extends Omit<useAvatarRoot.ReturnValue, 'getRootProps'> {
  state: AvatarRoot.State;
}

export const AvatarRootContext = React.createContext<AvatarRootContext | undefined>(undefined);

if (process.env.NODE_ENV !== 'production') {
  AvatarRootContext.displayName = 'AvatarRootContext';
}

export function useAvatarRootContext() {
  const context = React.useContext(AvatarRootContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: AvatarRootContext is missing. Avatar parts must be placed within <Avatar.Root>.',
    );
  }
  return context;
}
