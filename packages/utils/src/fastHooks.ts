import * as React from 'react';

type HookType = {
  before: (scope: any) => void;
  after: (scope: any) => void;
};

const hooks: HookType[] = [];

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
  tick: number;
  setTick: React.Dispatch<React.SetStateAction<number>>;
  index: number;
  data: StateData<unknown>[];
};

type MemoContext = {
  index: number;
  data: CallbackData<unknown>[];
};

export type Scope = {
  didInitialize: boolean;
  useEffect: EffectContext;
  useLayoutEffect: EffectContext;
  useInsertionEffect: EffectContext;
  useRef: RefContext;
  useCallback: CallbackContext;
  useState: StateContext;
  useMemo: MemoContext;
};

let currentScope: Scope | undefined = undefined;

const emptySetState = (_: React.SetStateAction<number>) => {
  throw new Error('Function not implemented.');
};

function createScope(): Scope {
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
      tick: 0,
      setTick: emptySetState,
    },
    useMemo: {
      index: 0,
      data: [],
    },
  };
}

export function getScope() {
  return currentScope;
}

export function setScope(scope: Scope | undefined): void {
  currentScope = scope;
}

export function register(hook: HookType): void {
  hooks.push(hook);
}

export function fastComponent<P extends object, E extends HTMLElement, R extends React.ReactNode>(
  fn: (props: P) => R,
): typeof fn {
  const FastComponent = (props: P, forwardedRef: React.Ref<E>): R => {
    const scope = useRefWithInit(createScope).current;

    let result;
    try {
      currentScope = scope;

      scope.useEffect.index = 0;
      scope.useLayoutEffect.index = 0;
      scope.useInsertionEffect.index = 0;
      scope.useRef.index = 0;
      scope.useCallback.index = 0;
      scope.useState.index = 0;
      scope.useMemo.index = 0;

      for (const hook of hooks) {
        hook.before(scope);
      }

      result = (fn as any)(props, forwardedRef);

      for (const hook of hooks) {
        hook.after(scope);
      }

      scope.didInitialize = true;
    } finally {
      currentScope = undefined;
    }

    return result;
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
    const context = currentScope?.[name];

    if (!context) {
      return reactUseEffect(create, deps);
    }

    if (currentScope!.didInitialize === false) {
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

    if (context.index === 1) {
      reactUseEffect(() => {
        for (const effect of context.data) {
          if (effect.didChange) {
            effect.didChange = false;
            effect.cleanup = effect.create() as any;
            effect.renderedDeps = effect.deps;
          }
        }
        return () => {
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
        };
      });
    }
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
  function useState<S>(initialState: S | (() => S)): [S, React.Dispatch<React.SetStateAction<S>>];
  function useState<S = undefined>(): [
    S | undefined,
    React.Dispatch<React.SetStateAction<S | undefined>>,
  ];
  function useState<S>(
    initialState?: S | (() => S),
  ): [S | undefined, React.Dispatch<React.SetStateAction<S | undefined>>] {
    const context = currentScope?.useState;

    if (!context) {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return React.useState(initialState);
    }

    if (context.index === 0) {
      const [tick, setTick] = React.useState(0);
      context.tick = tick;
      context.setTick = setTick;
    }

    if (currentScope!.didInitialize === false) {
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

          context.tick = (context.tick + 1) >> 0;
          context.setTick(context.tick);
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
    const context = currentScope?.useMemo;

    if (!context) {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return React.useMemo(factory, deps);
    }

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
