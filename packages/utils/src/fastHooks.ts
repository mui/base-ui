import * as React from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';
import type { ReadonlyStore } from './store/Store';

type Effect = {
  cleanup: (() => void) | undefined;
  create: () => (() => void) | void;
  deps: unknown[] | undefined;
  renderedDeps: unknown[] | undefined;
  didChange: boolean;
};

type EffectContext = {
  index: number;
  data: Effect[];
};

type RefData<T> = {
  current: T;
};

type RefContext = {
  index: number;
  data: RefData<unknown>[];
};

type CallbackData<T> = {
  callback: T;
  deps: readonly unknown[] | undefined;
};

type CallbackContext = {
  index: number;
  data: CallbackData<unknown>[];
};

type StateData<T> = [T, React.Dispatch<React.SetStateAction<T>>];

type StateContext = {
  index: number;
  data: StateData<unknown>[];
};

type MemoContext = {
  index: number;
  data: CallbackData<unknown>[];
};

export type StoreContext = {
  index: number;
  tick: number;
  hooks: {
    store: any;
    selector: Function;
    a1: unknown;
    a2: unknown;
    a3: unknown;
    value: unknown;
    didChange: boolean;
  }[];
};

// Todo:
// - Use a single hook of each kind for all scopes
// - Mount & clean up logic for scopes that are no longer used
// - Support nested scopes

// prettier-ignore
enum Flags {
  None                 = 0,
  HasEffect            = 1 << 0,
  HasLayoutEffect      = 1 << 1,
  HasInsertionEffect   = 1 << 2,
  HasState             = 1 << 3,
  HasStore = 1 << 4,
  All                  = (1 << 5) - 1,
}

class Root {
  flags: number;
  state: [number, React.Dispatch<React.SetStateAction<number>>] | undefined;
  syncTick: number;
  subscribe: ((onStoreChange: any) => () => void) | undefined;
  getSnapshot: (() => any) | undefined;
  didChangeStore: boolean;
  scopes: {
    previous: Record<string, Scope> | undefined;
    next: Record<string, Scope>;
  };

  static create() {
    return new Root();
  }

  constructor() {
    this.flags = Flags.None;
    this.state = undefined;
    this.syncTick = 1;
    this.subscribe = undefined;
    this.getSnapshot = undefined;
    this.didChangeStore = false;
    this.scopes = {
      previous: undefined,
      next: {
        default: createScope(this),
      },
    };
  }

  use() {
    if (this.flags & Flags.HasState) {
      this.setupState();
    }
    if (this.flags & Flags.HasEffect) {
      this.setupEffect('useEffect');
    }
    if (this.flags & Flags.HasLayoutEffect) {
      this.setupEffect('useLayoutEffect');
    }
    if (this.flags & Flags.HasInsertionEffect) {
      this.setupEffect('useInsertionEffect');
    }
    if (this.flags & Flags.HasStore) {
      this.setupStore();
    }
    for (const scopeName in this.scopes.next) {
      const scope = this.scopes.next[scopeName];
      scope.didInitialize = true;
    }
  }

  setupState() {
    this.state = React.useState(0);
  }

  setupEffect(type: 'useEffect' | 'useLayoutEffect' | 'useInsertionEffect') {
    const reactUseEffect =
      type === 'useEffect'
        ? React.useEffect
        : type === 'useLayoutEffect'
          ? React.useLayoutEffect
          : React.useInsertionEffect;

    reactUseEffect(() => {
      for (const scopeName in this.scopes.next) {
        const scope = this.scopes.next[scopeName];
        const context = scope[type];
        for (const effect of context.data) {
          if (effect.didChange) {
            effect.didChange = false;
            effect.cleanup = effect.create() as any;
            effect.renderedDeps = effect.deps;
          }
        }
      }

      return () => {
        for (const scopeName in this.scopes.next) {
          const scope = this.scopes.next[scopeName];
          const context = scope[type];
          for (const effect of context.data) {
            const previousDeps = effect.renderedDeps;
            const currentDeps = effect.deps;

            effect.didChange =
              effect.didChange ||
              currentDeps === undefined ||
              previousDeps === undefined ||
              areDepsEqual(previousDeps, currentDeps) === false;

            if (effect.didChange) {
              effect.cleanup?.();
            }
          }
        }
        for (const scopeName in this.scopes.previous) {
          const scope = this.scopes.previous[scopeName];
          if (scopeName in this.scopes.next) {
            continue;
          }
          const context = scope[type];
          for (const effect of context.data) {
            effect.cleanup?.();
          }
        }
        this.scopes.previous = this.scopes.next;
        this.scopes.next = {
          default: this.scopes.previous.default,
        };
      };
    });
  }

  setupStore() {
    if (!this.getSnapshot) {
      this.getSnapshot = () => {
        let didChange = false;
        for (const scopeName in this.scopes.next) {
          const scope = this.scopes.next[scopeName];
          const context = scope['useStore'];

          for (let i = 0; i < context.hooks.length; i += 1) {
            const hook = context.hooks[i];
            const value = hook.selector(hook.store.state, hook.a1, hook.a2, hook.a3);
            if (hook.didChange || !Object.is(hook.value, value)) {
              didChange = true;
              hook.value = value;
              hook.didChange = false;
            }
          }
        }
        if (didChange) {
          this.syncTick += 1;
        }
        return this.syncTick;
      };
    }
    if (this.didChangeStore || !this.subscribe) {
      this.didChangeStore = false;
      this.subscribe = (onStoreChange) => {
        const stores = new Set<ReadonlyStore<unknown>>();

        for (const scopeName in this.scopes.next) {
          const scope = this.scopes.next[scopeName];
          const context = scope['useStore'];
          for (const hook of context.hooks) {
            stores.add(hook.store);
          }
        }
        const unsubscribes: Array<() => void> = [];
        for (const store of stores) {
          unsubscribes.push(store.subscribe(onStoreChange));
        }
        return () => {
          for (const unsubscribe of unsubscribes) {
            unsubscribe();
          }
        };
      };
    }

    // eslint-disable-next-line react-hooks/rules-of-hooks
    useSyncExternalStore(this.subscribe, this.getSnapshot, this.getSnapshot);
  }
}

export type Scope = {
  didInitialize: boolean;
  useEffect: EffectContext;
  useLayoutEffect: EffectContext;
  useInsertionEffect: EffectContext;
  useRef: RefContext;
  useCallback: CallbackContext;
  useState: StateContext;
  useMemo: MemoContext;
  useStore: StoreContext;
  root: Root;
};

let currentRoot: Root | undefined = undefined;
let currentScope: Scope | undefined = undefined;

function createScope(root: Root): Scope {
  return {
    didInitialize: false,
    useEffect: {
      index: 0,
      data: [],
    },
    useLayoutEffect: {
      index: 0,
      data: [],
    },
    useInsertionEffect: {
      index: 0,
      data: [],
    },
    useRef: {
      index: 0,
      data: [],
    },
    useCallback: {
      index: 0,
      data: [],
    },
    useState: {
      index: 0,
      data: [],
    },
    useMemo: {
      index: 0,
      data: [],
    },
    useStore: {
      index: 0,
      tick: 0,
      hooks: [],
    },
    root,
  };
}

export function getScope() {
  return currentScope;
}

function enterScope(scope: Scope) {
  scope.useEffect.index = 0;
  scope.useLayoutEffect.index = 0;
  scope.useInsertionEffect.index = 0;
  scope.useRef.index = 0;
  scope.useCallback.index = 0;
  scope.useState.index = 0;
  scope.useMemo.index = 0;
  scope.useStore.index = 0;
}

let nextScopeId = 0;

export class LazyScope {
  name: string;
  isMounted: boolean;
  constructor() {
    this.name = 's' + nextScopeId++;
    this.isMounted = false;
  }
  use<T>(
    hook: () => T,
    defaultValue: T | undefined = undefined,
  ): typeof defaultValue extends undefined ? T | undefined : T {
    if (this.isMounted) {
      return runWithScope(this.name, hook);
    }
    return defaultValue as any;
  }
  static create() {
    return new LazyScope();
  }
}

export function useLazyScope(shouldMount: boolean): LazyScope {
  if (!currentRoot) {
    throw new Error('useLazyScope must be used within a fastComponent');
  }
  currentRoot.flags |= Flags.All;
  const lazy = useRefWithInit(LazyScope.create).current;
  lazy.isMounted ||= shouldMount;
  return lazy;
}

function runWithScope<T>(scopeName: string, fn: () => T): T {
  let scope = currentRoot!.scopes.next[scopeName];
  if (!scope) {
    scope = currentRoot!.scopes.previous?.[scopeName] ?? createScope(currentRoot!);
    currentRoot!.scopes.next[scopeName] = scope;
  }

  const previousScope = currentScope;
  currentScope = scope;

  let result;
  try {
    enterScope(currentScope);

    result = fn();
  } finally {
    currentScope = previousScope;
  }

  return result;
}

export function fastComponent<P extends object, E extends HTMLElement, R extends React.ReactNode>(
  fn: (props: P) => R,
): typeof fn {
  const FastComponent = (props: P, forwardedRef: React.Ref<E>): R => {
    currentRoot = useRefWithInit(Root.create).current as Root;
    try {
      return runWithScope('default', () => (fn as any)(props, forwardedRef));
    } catch (error) {
      console.error('fastComponent error:', error);
      throw error;
    } finally {
      currentRoot.use();
      currentRoot = undefined;
    }
  };
  FastComponent.displayName = (fn as any).displayName || fn.name;
  return FastComponent as unknown as typeof fn;
}

export function fastComponentRef<
  P extends object,
  E extends HTMLElement,
  R extends React.ReactNode,
>(fn: (props: React.PropsWithoutRef<P>, forwardedRef: React.Ref<E>) => R) {
  return React.forwardRef<E, P>(fastComponent(fn as any) as unknown as typeof fn);
}

export const createUseEffect = (name: 'useEffect' | 'useLayoutEffect' | 'useInsertionEffect') => {
  // // Detect useInsertionEffect availability at module load time
  // // https://github.com/mui/material-ui/issues/41190#issuecomment-2040873379
  // const reactUseInsertionEffect = (React as any)[
  //   `useInsertionEffect${Math.random().toFixed(1)}`.slice(0, -3)
  // ];
  //
  // // XXX
  // const safeUseInsertionEffect =
  //   // React 17 doesn't have useInsertionEffect.
  //   reactUseInsertionEffect &&
  //   // Preact replaces useInsertionEffect with useLayoutEffect and fires too late.
  //   reactUseInsertionEffect !== React.useLayoutEffect
  //     ? reactUseInsertionEffect
  //     : React.useLayoutEffect;

  const reactUseEffect =
    name === 'useEffect'
      ? React.useEffect
      : name === 'useLayoutEffect'
        ? React.useLayoutEffect
        : React.useInsertionEffect;

  const useEffect = (create: () => (() => void) | void, deps?: unknown[]): void => {
    const scope = currentScope;
    if (!scope) {
      return reactUseEffect(create, deps);
    }
    const context = scope[name];

    if (scope.didInitialize === false) {
      context.data.push({
        create,
        cleanup: undefined,
        deps,
        renderedDeps: undefined,
        didChange: true,
      });
    } else {
      const effect = context.data[context.index];

      effect.create = create;
      effect.deps = deps;
    }

    context.index += 1;
    scope.root.flags |=
      name === 'useEffect'
        ? Flags.HasEffect
        : name === 'useLayoutEffect'
          ? Flags.HasLayoutEffect
          : Flags.HasInsertionEffect;
  };

  return useEffect;
};

export const createUseRef = () => {
  // Use the same signature as React.useRef
  const useRef = <T>(
    initialValue?: T | null,
  ): React.MutableRefObject<T | undefined> | React.RefObject<T | null> => {
    const context = currentScope?.useRef;

    if (!context) {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return React.useRef(initialValue) as React.MutableRefObject<T | undefined>;
    }

    if (currentScope!.didInitialize === false) {
      const refData: RefData<T | undefined | null> = { current: initialValue };
      context.data.push(refData as RefData<unknown>);
      context.index += 1;
      return refData as React.MutableRefObject<T | undefined>;
    }

    const refData = context.data[context.index] as RefData<T | undefined | null>;
    context.index += 1;
    return refData as React.MutableRefObject<T | undefined>;
  };

  return useRef as typeof React.useRef;
};

export const createUseCallback = () => {
  function useCallback<T extends Function>(callback: T, deps: React.DependencyList): T {
    const context = currentScope?.useCallback;

    if (!context) {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return React.useCallback(callback, deps);
    }

    if (currentScope!.didInitialize === false) {
      const callbackData: CallbackData<T> = { callback, deps };
      context.data.push(callbackData as CallbackData<unknown>);
      context.index += 1;
      return callback;
    }

    const callbackData = context.data[context.index] as CallbackData<T>;
    const previousDeps = callbackData.deps;

    if (
      previousDeps === undefined ||
      areDepsEqual(previousDeps as unknown[], deps as unknown[]) === false
    ) {
      callbackData.callback = callback;
      callbackData.deps = deps;
    }

    context.index += 1;
    return callbackData.callback;
  }

  return useCallback;
};

export const createUseState = () => {
  function increase(tick: number): number {
    return tick + 1;
  }

  function useState<S>(initialState: S | (() => S)): [S, React.Dispatch<React.SetStateAction<S>>];
  function useState<S = undefined>(): [
    S | undefined,
    React.Dispatch<React.SetStateAction<S | undefined>>,
  ];
  function useState<S>(
    initialState?: S | (() => S),
  ): [S | undefined, React.Dispatch<React.SetStateAction<S | undefined>>] {
    if (!currentScope) {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return React.useState(initialState);
    }

    const context = currentScope.useState;
    const root = currentScope.root;

    root.flags |= Flags.HasState;

    if (currentScope.didInitialize === false) {
      const index = context.index;

      const value = typeof initialState === 'function' ? (initialState as () => S)() : initialState;

      const setValue = (action: React.SetStateAction<S | undefined>) => {
        const previousData = context.data[index];

        const previousValue = previousData[0];
        const previousSetValue = previousData[1];

        const newValue =
          typeof action === 'function'
            ? (action as (prev: S | undefined) => S | undefined)(previousValue as any)
            : action;

        if (Object.is(previousValue, newValue) === false) {
          const nextData = [newValue, previousSetValue] as StateData<S | undefined>;
          context.data[index] = nextData as any;

          const [_, setTick] = root.state!;
          setTick(increase);
        }
      };

      const stateData: StateData<S | undefined> = [value, setValue];

      context.data.push(stateData as StateData<unknown>);
      context.index += 1;

      return stateData;
    }

    const stateData = context.data[context.index] as StateData<S | undefined>;
    context.index += 1;

    return stateData;
  }

  return useState;
};

export const createUseMemo = () => {
  function useMemo<T>(factory: () => T, deps: React.DependencyList): T {
    if (!currentScope) {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return React.useMemo(factory, deps);
    }

    const context = currentScope.useMemo;

    if (currentScope!.didInitialize === false) {
      const value = factory();
      const callbackData: CallbackData<T> = { callback: value, deps };
      context.data.push(callbackData as CallbackData<unknown>);
      context.index += 1;
      return value;
    }

    const callbackData = context.data[context.index] as CallbackData<T>;
    const previousDeps = callbackData.deps;

    if (
      previousDeps === undefined ||
      areDepsEqual(previousDeps as unknown[], deps as unknown[]) === false
    ) {
      const value = factory();
      callbackData.callback = value;
      callbackData.deps = deps;
    }

    context.index += 1;
    return callbackData.callback;
  }

  return useMemo;
};

export const createUseStore = (defaultUseStore: any) => {
  function useStore(
    store: ReadonlyStore<unknown>,
    selector: Function,
    a1?: unknown,
    a2?: unknown,
    a3?: unknown,
  ): unknown {
    if (!currentScope) {
      return defaultUseStore(store, selector, a1, a2, a3);
    }

    const scope = currentScope;
    const root = scope.root;
    const context = scope.useStore;

    const index = context.index;
    context.index += 1;

    let hook;
    if (!scope.didInitialize) {
      hook = {
        store,
        selector,
        a1,
        a2,
        a3,
        value: selector(store.getSnapshot(), a1, a2, a3),
        didChange: false,
      };
      context.hooks.push(hook);
      root.didChangeStore = true;
    } else {
      hook = context.hooks[index];
      if (
        hook.store !== store ||
        hook.selector !== selector ||
        !Object.is(hook.a1, a1) ||
        !Object.is(hook.a2, a2) ||
        !Object.is(hook.a3, a3)
      ) {
        if (hook.store !== store) {
          root.didChangeStore = true;
        }
        hook.store = store;
        hook.selector = selector;
        hook.a1 = a1;
        hook.a2 = a2;
        hook.a3 = a3;
        hook.didChange = true;
      }
    }

    return hook.value;
  }
  return useStore;
};

const UNINITIALIZED = {};

/* We need to re-implement it here to avoid circular dependencies */
function useRefWithInit(init: (arg?: unknown) => unknown, initArg?: unknown) {
  const ref = React.useRef(UNINITIALIZED as any);
  if (ref.current === UNINITIALIZED) {
    ref.current = init(initArg);
  }
  return ref;
}

function areDepsEqual(depsA: readonly unknown[], depsB: readonly unknown[]): boolean {
  if (depsA.length !== depsB.length) {
    return false;
  }

  for (let i = 0; i < depsA.length; i++) {
    if (Object.is(depsA[i], depsB[i]) === false) {
      return false;
    }
  }

  return true;
}
