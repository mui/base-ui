'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { StateAttributesMapping } from '../../utils/getStateAttributesProps';
import { useTreeRootContext } from '../root/TreeRootContext';
import { useTreeItemContext } from '../item/TreeItemContext';
import { TreeItemLoadingIndicatorDataAttributes } from './TreeItemLoadingIndicatorDataAttributes';

const stateAttributesMapping: StateAttributesMapping<TreeItemLoadingIndicator.State> = {
  loading: (v) => (v ? { [TreeItemLoadingIndicatorDataAttributes.loading]: '' } : null),
};

/**
 * Displays a loading indicator for a tree item that is lazily loading its children.
 * Only renders when the item is in a loading state.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Tree](https://base-ui.com/react/components/tree)
 */
export const TreeItemLoadingIndicator = React.forwardRef(function TreeItemLoadingIndicator(
  componentProps: TreeItemLoadingIndicator.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { className, render, ...elementProps } = componentProps;

  const store = useTreeRootContext();
  const { itemId } = useTreeItemContext();
  const propsFromState = store.useState('loadingIndicatorProps', itemId);

  const state: TreeItemLoadingIndicator.State = {
    loading: propsFromState.loading,
  };

  return useRenderElement('span', componentProps, {
    state,
    ref: forwardedRef,
    props: [{} as React.HTMLAttributes<HTMLSpanElement>, elementProps],
    stateAttributesMapping,
    enabled: propsFromState.loading,
  });
});

export interface TreeItemLoadingIndicatorState {
  loading: boolean;
}

export interface TreeItemLoadingIndicatorProps extends BaseUIComponentProps<
  'span',
  TreeItemLoadingIndicatorState
> {}

export namespace TreeItemLoadingIndicator {
  export type State = TreeItemLoadingIndicatorState;
  export type Props = TreeItemLoadingIndicatorProps;
}
