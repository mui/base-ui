'use client';
import * as React from 'react';
import type { ImageLoadingStatus } from './AvatarRoot';
import { useContext } from '../../utils/createContext';

export interface AvatarRootContext {
  imageLoadingStatus: ImageLoadingStatus;
  setImageLoadingStatus: React.Dispatch<React.SetStateAction<ImageLoadingStatus>>;
}

export const AvatarRootContext = React.createContext<AvatarRootContext | undefined>(undefined);

export function useAvatarRootContext() {
  return useContext(
    AvatarRootContext,
    'Base UI: AvatarRootContext is missing. Avatar parts must be placed within <Avatar.Root>.',
  );
}
