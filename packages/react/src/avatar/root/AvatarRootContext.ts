'use client';
import * as React from 'react';
import type { ImageLoadingStatus } from './AvatarRoot';

export interface AvatarRootContext {
  imageLoadingStatus: ImageLoadingStatus;
  setImageLoadingStatus: React.Dispatch<React.SetStateAction<ImageLoadingStatus>>;
  /**
   * Avatar.Image assigns this synchronously during render so Avatar.Fallback (when listed after Image) can observe
   * `loaded` on the same commit before lifted state catches up (`idle`→`loaded` sync only happens in layout).
   */
  transientImageLoadingStatusRef: React.MutableRefObject<ImageLoadingStatus | undefined>;
}

export const AvatarRootContext = React.createContext<AvatarRootContext | undefined>(undefined);

export function useAvatarRootContext() {
  const context = React.useContext(AvatarRootContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: AvatarRootContext is missing. Avatar parts must be placed within <Avatar.Root>.',
    );
  }
  return context;
}
