interface CacheNode {
  computed: boolean;
  value: unknown;
  objects: WeakMap<object, CacheNode> | null;
  primitives: Map<unknown, CacheNode> | null;
}

const createCacheNode = (): CacheNode => ({
  computed: false,
  value: undefined,
  objects: null,
  primitives: null,
});

const isObjectLike = (value: unknown): value is object =>
  (typeof value === 'object' && value !== null) || typeof value === 'function';

/**
 * Memoizes a function using a tree of caches keyed by its arguments.
 * Object arguments are held weakly, so cached results can be garbage collected
 * together with the arguments that produced them.
 */
export function weakMapMemoize<F extends (...args: any[]) => any>(func: F): F {
  const root = createCacheNode();

  function memoized(...args: any[]) {
    let node = root;
    for (let i = 0; i < args.length; i += 1) {
      const arg = args[i];
      if (isObjectLike(arg)) {
        if (node.objects === null) {
          node.objects = new WeakMap();
        }
        let child = node.objects.get(arg);
        if (child === undefined) {
          child = createCacheNode();
          node.objects.set(arg, child);
        }
        node = child;
      } else {
        if (node.primitives === null) {
          node.primitives = new Map();
        }
        let child = node.primitives.get(arg);
        if (child === undefined) {
          child = createCacheNode();
          node.primitives.set(arg, child);
        }
        node = child;
      }
    }

    if (!node.computed) {
      node.value = func(...args);
      node.computed = true;
    }
    return node.value;
  }

  return memoized as unknown as F;
}
