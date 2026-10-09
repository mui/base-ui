'use client';
import * as React from 'react';
import type { FloatingTreeType } from '../../utils/popups/floating-root/types';
import type { PreviewCardStore } from '../store/PreviewCardStore';

export type PreviewCardRootContext<Payload = unknown> = PreviewCardStore<Payload>;

export const PreviewCardRootContext = React.createContext<PreviewCardRootContext | undefined>(
  undefined,
);

/**
 * The preview card's node in the popup tree: its id and the tree the Root registered it in. The Root
 * registers the node; the Positioner attaches its snapshot to the same tree and provides it as the
 * parent of popups nested inside the preview card.
 */
export const PreviewCardTreeNodeContext = React.createContext<{
  id: string | undefined;
  tree: FloatingTreeType | null;
} | null>(null);

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
