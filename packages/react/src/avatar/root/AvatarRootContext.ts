'use client';
import * as React from 'react';
import type { ImageLoadingStatus } from './AvatarRoot';

export interface AvatarRootContext {
  imageLoadingStatus: ImageLoadingStatus;
  setImageLoadingStatus: React.Dispatch<React.SetStateAction<ImageLoadingStatus>>;
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
