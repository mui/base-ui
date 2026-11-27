'use client';
import * as React from 'react';
import { EMPTY_ARRAY } from '@base-ui/utils/empty';
import { warn } from '@base-ui/utils/warn';
import type { TreeStore } from '../store/TreeStore';
import type { TreeState } from '../store/types';
import { getTreeNamespace } from '../utils/assertTreeKind';
import { TreeRootContext } from './TreeRootContext';

/** The store state a provider wrapping the root controls. */
export type TreeRootFeatureState = Pick<TreeState, 'filterOptions'>;

/**
 * What a provider wrapping the root adds to the tree, such as filtering, or what
 * `TreeGrid.Root` adds to the `Tree.Root` it renders. Only the provider imports the feature's implementation, so trees that
 * don't render the provider don't bundle it.
 */
export interface TreeRootFeature {
  /** The provider's part name, such as `FilterProvider`, for its misplacement warnings. */
  name?: string | undefined;
  /**
   * Adds the feature's plugin to the store, such as `store.filtering`. Runs when
   * the root creates its store, so the first render already has the plugin.
   */
  install?: ((store: TreeStore<any, any>) => void) | undefined;
  /**
   * The store state the feature reads, from the provider's props. The root applies
   * it at creation, then synchronizes it in the same update as its own props, so
   * the store never mixes new items with stale feature state.
   */
  state?: TreeRootFeatureState | undefined;
}

/**
 * The features of the providers wrapping a root. Each root resets it, so a
 * tree nested in another tree's items doesn't inherit them.
 */
export const TreeRootFeaturesContext = React.createContext<readonly TreeRootFeature[]>(EMPTY_ARRAY);

function warnMisplacedProvider(store: TreeStore<any, any>, name: string | undefined) {
  if (name === undefined) {
    return;
  }
  const component = getTreeNamespace(store);
  warn(
    `<${component}.${name}> has no effect inside <${component}.Root>.`,
    'Providers configure the tree they wrap.',
    `Render <${component}.${name}> around <${component}.Root> instead.`,
  );
}

/**
 * Adds a feature to the `Tree.Root` it wraps, after the features of the providers
 * around it.
 */
export function TreeRootFeatureProvider(props: TreeRootFeatureProvider.Props) {
  const { feature, children } = props;
  const parentFeatures = React.useContext(TreeRootFeaturesContext);
  const features = React.useMemo(() => [...parentFeatures, feature], [parentFeatures, feature]);

  // A provider without children can't wrap a root, so inside a root it's misplaced.
  const rootStore = React.useContext(TreeRootContext);
  const misplacedIn = children == null ? rootStore : undefined;
  React.useEffect(() => {
    if (process.env.NODE_ENV !== 'production' && misplacedIn !== undefined) {
      warnMisplacedProvider(misplacedIn, feature.name);
    }
  }, [misplacedIn, feature.name]);

  return (
    <TreeRootFeaturesContext.Provider value={features}>{children}</TreeRootFeaturesContext.Provider>
  );
}

export namespace TreeRootFeatureProvider {
  export interface Props {
    feature: TreeRootFeature;
    children?: React.ReactNode;
  }
}

/**
 * Warns about the providers between a root and its list. The root resets the
 * features it applies, so any feature a list still sees comes from a provider
 * rendered inside the root, where it configures nothing.
 */
export function useWarnMisplacedTreeRootFeatures(store: TreeStore<any, any>) {
  const features = React.useContext(TreeRootFeaturesContext);
  React.useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      for (const feature of features) {
        warnMisplacedProvider(store, feature.name);
      }
    }
  }, [store, features]);
}
