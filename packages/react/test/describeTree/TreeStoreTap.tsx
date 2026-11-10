import * as React from 'react';
import { useTreeRootContext } from '../../src/tree/root/TreeRootContext';
import type { TreeStore } from '../../src/tree/store/TreeStore';

/**
 * Exposes the internal TreeStore to a test via the root context, so the test
 * can drive interaction state imperatively (jsdom lacks real layout,
 * scroll, and IntersectionObserver behavior).
 */
export function TreeStoreTap(props: { storeRef: React.RefObject<TreeStore | null> }) {
  const store = useTreeRootContext();
  React.useEffect(() => {
    props.storeRef.current = store;
    return () => {
      props.storeRef.current = null;
    };
  }, [store, props.storeRef]);
  return null;
}
