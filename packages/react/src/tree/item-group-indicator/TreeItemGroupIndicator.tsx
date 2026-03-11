'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { StateAttributesMapping } from '../../utils/getStateAttributesProps';
import { useTreeRootContext } from '../root/TreeRootContext';
import { useTreeItemContext } from '../item/TreeItemContext';
import { TreeItemGroupIndicatorDataAttributes } from './TreeItemGroupIndicatorDataAttributes';

const EXPANDED_HOOK = { [TreeItemGroupIndicatorDataAttributes.expanded]: '' };
const COLLAPSED_HOOK = { [TreeItemGroupIndicatorDataAttributes.collapsed]: '' };

const stateAttributesMapping = {
  expanded(v: boolean) {
    return v ? EXPANDED_HOOK : COLLAPSED_HOOK;
  },
} satisfies StateAttributesMapping<TreeItemGroupIndicator.State>;

/**
 * A visual indicator for expandable tree items.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Tree](https://base-ui.com/react/components/tree)
 */
export const TreeItemGroupIndicator = React.forwardRef(function TreeItemGroupIndicator(
  componentProps: TreeItemGroupIndicator.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { className, render, ...elementProps } = componentProps;

  const store = useTreeRootContext();
  const { itemId } = useTreeItemContext();
  const propsFromState = store.useState('groupIndicatorProps', itemId);

  const state: TreeItemGroupIndicator.State = {
    expanded: propsFromState.expanded,
    expandable: propsFromState.expandable,
  };

  return useRenderElement('span', componentProps, {
    state,
    ref: forwardedRef,
    props: [{} as React.HTMLAttributes<HTMLSpanElement>, elementProps],
    stateAttributesMapping,
    enabled: propsFromState.expandable,
  });
});

export interface TreeItemGroupIndicatorState {
  /**
   * Whether the item is currently expanded.
   */
  expanded: boolean;
  /**
   * Whether the item has children and can be expanded.
   */
  expandable: boolean;
}

export interface TreeItemGroupIndicatorProps extends BaseUIComponentProps<
  'span',
  TreeItemGroupIndicatorState
> {}

export namespace TreeItemGroupIndicator {
  export type State = TreeItemGroupIndicatorState;
  export type Props = TreeItemGroupIndicatorProps;
}
