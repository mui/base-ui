import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import { selectors } from '../store/selectors';
import type { TreeItemId } from '../store/types';
import type { TreeStore } from '../store/TreeStore';

export function TreeItemModelProvider(props: {
  store: TreeStore<any, any>;
  itemId: TreeItemId;
  animatedChildren?: React.ReactNode;
  children: (item: any, animatedChildren: React.ReactNode) => React.ReactNode;
}) {
  const model = useStore(props.store, selectors.itemModel, props.itemId);
  return props.children(model, props.animatedChildren ?? null) as React.JSX.Element;
}
