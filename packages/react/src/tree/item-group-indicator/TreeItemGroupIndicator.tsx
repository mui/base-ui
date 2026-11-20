'use client';
import type * as React from 'react';
import { fastComponentRef } from '@base-ui/utils/fastHooks';
import type { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { useTreeRootContext } from '../root/TreeRootContext';
import { useTreeItemContext } from '../item/TreeItemContext';
import { expansionMapping } from '../utils/stateAttributesMapping';

/**
 * A visual indicator for expandable tree items.
 * Renders a `<span>` element when the item can be expanded.
 *
 * Documentation: [Base UI Tree](https://base-ui.com/react/components/tree)
 */
export const TreeItemGroupIndicator = fastComponentRef(function TreeItemGroupIndicator(
  componentProps: TreeItemGroupIndicator.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { className, render, style, ...elementProps } = componentProps;

  const store = useTreeRootContext();
  const itemId = useTreeItemContext();
  const expanded = store.useState('isItemExpanded', itemId);
  const expandable = store.useState('isItemExpandable', itemId);

  const state: TreeItemGroupIndicator.State = { expanded };

  return useRenderElement('span', componentProps, {
    state,
    ref: forwardedRef,
    props: [{ 'aria-hidden': true }, elementProps],
    stateAttributesMapping: expansionMapping,
    enabled: expandable,
  });
});

export interface TreeItemGroupIndicatorState {
  /**
   * Whether the item is currently expanded.
   */
  expanded: boolean;
}

export interface TreeItemGroupIndicatorProps extends BaseUIComponentProps<
  'span',
  TreeItemGroupIndicatorState
> {}

export namespace TreeItemGroupIndicator {
  export type State = TreeItemGroupIndicatorState;
  export type Props = TreeItemGroupIndicatorProps;
}
