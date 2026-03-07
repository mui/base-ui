'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { StateAttributesMapping } from '../../utils/getStateAttributesProps';
import { useTreeRootContext } from '../root/TreeRootContext';
import { useTreeItemContext } from '../item/TreeItemContext';
import { TreeItemErrorIndicatorDataAttributes } from './TreeItemErrorIndicatorDataAttributes';

const stateAttributesMapping: StateAttributesMapping<TreeItemErrorIndicator.State> = {
  hasError: (v) => (v ? { [TreeItemErrorIndicatorDataAttributes.error]: '' } : null),
};

/**
 * Displays an error indicator for a tree item that failed to load its children.
 * Only renders when the item is in an error state.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Tree](https://base-ui.com/react/components/tree)
 */
export const TreeItemErrorIndicator = React.forwardRef(function TreeItemErrorIndicator(
  componentProps: TreeItemErrorIndicator.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { className, render, ...elementProps } = componentProps;

  const store = useTreeRootContext();
  const { itemId } = useTreeItemContext();
  const propsFromState = store.useState('errorIndicatorProps', itemId);

  const state: TreeItemErrorIndicator.State = {
    hasError: propsFromState.hasError,
  };

  return useRenderElement('span', componentProps, {
    state,
    ref: forwardedRef,
    props: [{} as React.HTMLAttributes<HTMLSpanElement>, elementProps],
    stateAttributesMapping,
    enabled: propsFromState.hasError,
  });
});

export interface TreeItemErrorIndicatorState {
  hasError: boolean;
}

export interface TreeItemErrorIndicatorProps extends BaseUIComponentProps<
  'span',
  TreeItemErrorIndicatorState
> {}

export namespace TreeItemErrorIndicator {
  export type State = TreeItemErrorIndicatorState;
  export type Props = TreeItemErrorIndicatorProps;
}
