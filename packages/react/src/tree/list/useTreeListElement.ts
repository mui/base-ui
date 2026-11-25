'use client';
import * as React from 'react';
import { useRenderElement } from '../../internals/useRenderElement';
import type { UseRenderElementComponentProps } from '../../internals/useRenderElement';
import { useTreeRootProps } from '../utils/useTreeRootProps';
import { useTreeListViewport } from './useTreeListViewport';

/**
 * Renders the element with `role="tree"`, or `role="treegrid"` in a tree grid,
 * around `children`, and keeps the focused row in view.
 */
export function useTreeListElement(
  componentProps: UseRenderElementComponentProps<{ disabled: boolean; empty: boolean }> & {
    id?: string | undefined;
  },
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
  elementProps: React.HTMLAttributes<HTMLDivElement>,
  children: React.ReactNode,
) {
  const { rootProps, rootRef, state } = useTreeRootProps(componentProps);

  const listRef = React.useRef<HTMLDivElement | null>(null);

  useTreeListViewport(listRef);

  return useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef, rootRef, listRef],
    props: [rootProps, { children }, elementProps],
  });
}
