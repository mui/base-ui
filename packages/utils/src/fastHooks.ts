import * as React from 'react';

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

type Instance = {
  didInitialize: boolean;
  useEffect: EffectContext;
  useLayoutEffect: EffectContext;
  useInsertionEffect: EffectContext;
  useRef: RefContext;
  useCallback: CallbackContext;
  useState: StateContext;
};

let currentInstance: Instance | undefined = undefined;

const emptySetState = (_: React.SetStateAction<number>) => {
  throw new Error('Function not implemented.');
};

export function createInstance(): Instance {
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
  };
}

export function getContext() {
  return currentInstance;
}

export function setContext(context: Instance | undefined): void {
  currentInstance = context;
}

export function use(): Disposable {
  const instance = useRefWithInit(createInstance).current;

  currentInstance = instance;

  instance.useEffect.index = 0;
  instance.useLayoutEffect.index = 0;
  instance.useInsertionEffect.index = 0;
  instance.useRef.index = 0;
  instance.useCallback.index = 0;
  instance.useState.index = 0;

  return {
    [Symbol.dispose]() {
      instance.didInitialize = true;
      currentInstance = undefined;
    },
  };
}

export function createComponent<P extends object, E extends HTMLElement>(
  fn: (props: P, forwardedRef: React.Ref<E>) => React.ReactNode,
) {
  const Wrapped = React.forwardRef(((props: P, forwardedRef: React.Ref<E>) => {
    const context = useRefWithInit(createInstance).current;

    let result;
    try {
      currentInstance = context;

      context.useEffect.index = 0;
      context.useLayoutEffect.index = 0;
      context.useInsertionEffect.index = 0;
      context.useRef.index = 0;
      context.useCallback.index = 0;
      context.useState.index = 0;

      result = fn(props, forwardedRef);

      context.didInitialize = true;
    } catch (error) {
      throw error;
    } finally {
      currentInstance = undefined;
    }

    return result;
  }) as any);
  Wrapped.displayName = (fn as any).displayName || fn.name;

  return Wrapped;
}

export const createUseEffect = (name: 'useEffect' | 'useLayoutEffect' | 'useInsertionEffect') => {
  const reactUseEffect =
    name === 'useEffect'
      ? React.useEffect
      : name === 'useLayoutEffect'
        ? React.useLayoutEffect
        : React.useInsertionEffect;

  const useEffect = (create: () => (() => void) | void, deps?: unknown[]): void => {
    const context = currentInstance?.[name];

    if (!context) {
      return reactUseEffect(create, deps);
    }

    if (currentInstance!.didInitialize === false) {
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

export const createUseRef = () => {
  // Use the same signature as React.useRef
  const useRef = <T>(
    initialValue?: T | null,
  ): React.MutableRefObject<T | undefined> | React.RefObject<T | null> => {
    const context = currentInstance?.useRef;

    if (!context) {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return React.useRef(initialValue) as React.MutableRefObject<T | undefined>;
    }

    if (currentInstance!.didInitialize === false) {
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
    const context = currentInstance?.useCallback;

    if (!context) {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return React.useCallback(callback, deps);
    }

    if (currentInstance!.didInitialize === false) {
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
    const context = currentInstance?.useState;

    if (!context) {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return React.useState(initialState);
    }

    if (context.index === 0) {
      const [tick, setTick] = React.useState(0);
      context.tick = tick;
      context.setTick = setTick;
    }

    if (currentInstance!.didInitialize === false) {
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

const UNINITIALIZED = {};

/* We need to re-implement it here to avoid circular dependencies */
function useRefWithInit(init: (arg?: unknown) => unknown, initArg?: unknown) {
  const ref = React.useRef(UNINITIALIZED as any);
  if (ref.current === UNINITIALIZED) {
    ref.current = init(initArg);
  }
  return ref;
}
