'use client';
import * as React from 'react';
import type { TransitionStatus } from '../../internals/useTransitionStatus';
import { PreviewCardStore } from '../store/PreviewCardStore';

export type PreviewCardRootContext<Payload = unknown> = PreviewCardStore<Payload>;

export const PreviewCardRootContext = React.createContext<PreviewCardRootContext | undefined>(
  undefined,
);

export function usePreviewCardRootContext(optional?: false): PreviewCardRootContext;
export function usePreviewCardRootContext(optional: true): PreviewCardRootContext | undefined;
export function usePreviewCardRootContext(optional?: boolean) {
  const context = React.useContext(PreviewCardRootContext);
  if (context === undefined && !optional) {
    throw new Error(
      'Base UI: PreviewCardRootContext is missing. PreviewCard parts must be placed within <PreviewCard.Root>.',
    );
  }

  return context;
}

// Separate contexts preserve subscriptions to individual lifecycle values.
export const PreviewCardOpenContext = React.createContext(false);
export const PreviewCardMountedContext = React.createContext(false);
export const PreviewCardTransitionStatusContext = React.createContext<TransitionStatus>(undefined);
