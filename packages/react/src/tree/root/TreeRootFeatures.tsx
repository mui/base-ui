'use client';
import * as React from 'react';
import { EMPTY_ARRAY } from '@base-ui/utils/empty';
import { warn } from '@base-ui/utils/warn';
import type { TreeStore } from '../store/TreeStore';
import type { TreeState } from '../store/types';
import { TreeRootContext } from './TreeRootContext';

/** The store state a provider wrapping `Tree.Root` controls. */
export type TreeRootFeatureState = Pick<TreeState, 'filterOptions'>;

/**
 * What a provider wrapping `Tree.Root` adds to the tree, such as filtering. Only the provider imports the feature's implementation, so trees that
 * don't render the provider don't bundle it.
 */
export interface TreeRootFeature {
  /** The provider's part name, such as `FilterProvider`, for warnings. */
  name: string;
  /**
   * Adds the feature's plugin to the store, such as `store.filtering`, and passes
   * the plugin's actions to `store.registerActions()` so they replace the store's
   * missing-provider fallbacks. Runs when the root creates its store, so the first
   * render already has the plugin.
   */
  install?: ((store: TreeStore<any, any>) => void) | undefined;
  /**
   * The store state the feature reads, from the provider's props. The root applies
   * it at creation, then synchronizes it in the same update as its own props, so
   * the store never mixes new items with stale feature state.
   */
  state?: TreeRootFeatureState | undefined;
  /**
   * Wraps the root's children with the feature's React logic, which reads the store
   * with `useTreeRootContext()`.
   */
  render?: ((children: React.ReactNode) => React.ReactNode) | undefined;
}

/**
 * The features of the providers wrapping a `Tree.Root`. Each root resets it, so a
 * tree nested in another tree's items doesn't inherit them.
 */
export const TreeRootFeaturesContext = React.createContext<readonly TreeRootFeature[]>(EMPTY_ARRAY);

function warnMisplacedProvider(name: string) {
  warn(
    `<Tree.${name}> has no effect inside <Tree.Root>.`,
    'Providers configure the tree they wrap.',
    `Render <Tree.${name}> around <Tree.Root> instead.`,
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
  const insideRoot = React.useContext(TreeRootContext) !== undefined;
  const childlessInsideRoot = insideRoot && children == null;
  React.useEffect(() => {
    if (process.env.NODE_ENV !== 'production' && childlessInsideRoot) {
      warnMisplacedProvider(feature.name);
    }
  }, [childlessInsideRoot, feature.name]);

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
export function useWarnMisplacedTreeRootFeatures() {
  const features = React.useContext(TreeRootFeaturesContext);
  React.useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      for (const feature of features) {
        warnMisplacedProvider(feature.name);
      }
    }
  }, [features]);
}
