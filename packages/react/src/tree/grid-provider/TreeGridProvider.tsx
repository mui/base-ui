'use client';
import * as React from 'react';
import { TreeGridPlugin } from '../plugins/TreeGridPlugin';
import { TreeRootFeatureProvider } from '../root/TreeRootFeatures';
import type { TreeRootFeature } from '../root/TreeRootFeatures';

const GRID_FEATURE: TreeRootFeature = { name: 'GridProvider', install: TreeGridPlugin.install };

/**
 * Lets the items of the tree it wraps contain controls that the keyboard reaches, such as
 * buttons, inputs, and links.
 * The tree then renders a `treegrid`, and each item renders its content in `Tree.ItemContent`.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Tree](https://base-ui.com/react/components/tree)
 */
export function TreeGridProvider(props: TreeGridProvider.Props): React.JSX.Element {
  return <TreeRootFeatureProvider feature={GRID_FEATURE}>{props.children}</TreeRootFeatureProvider>;
}

export interface TreeGridProviderState {}

export interface TreeGridProviderProps {
  /**
   * The `<Tree.Root>` whose items contain controls.
   */
  children?: React.ReactNode;
}

export namespace TreeGridProvider {
  export type State = TreeGridProviderState;
  export type Props = TreeGridProviderProps;
}
