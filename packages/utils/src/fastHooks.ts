import * as React from 'react';
import { useRefWithInit } from './useRefWithInit';

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
  didInitialize: boolean;
};

type RefData<T> = {
  current: T;
};

type RefContext = {
  index: number;
  data: RefData<unknown>[];
  didInitialize: boolean;
};

type CallbackData<T> = {
  callback: T;
  deps: readonly unknown[] | undefined;
};

type CallbackContext = {
  index: number;
  data: CallbackData<unknown>[];
  didInitialize: boolean;
};

type Context = {
  useEffect: EffectContext;
  useLayoutEffect: EffectContext;
  useRef: RefContext;
  useCallback: CallbackContext;
};

let currentContext: Context | undefined = undefined;

export function createContext(): Context {
  return {
    useEffect: {
      index: 0,
      data: [],
      didInitialize: false,
    },
    useLayoutEffect: {
      index: 0,
      data: [],
      didInitialize: false,
    },
    useRef: {
      index: 0,
      data: [],
      didInitialize: false,
    },
    useCallback: {
      index: 0,
      data: [],
      didInitialize: false,
    },
  };
}

export function getContext() {
  return currentContext;
}

export function setContext(context: Context | undefined): void {
  currentContext = context;
}

export function use(): Disposable {
  const context = useRefWithInit(createContext).current;

  const previousContext = currentContext;
  currentContext = context;

  context.useEffect.index = 0;
  context.useLayoutEffect.index = 0;
  context.useRef.index = 0;
  context.useCallback.index = 0;

  return {
    [Symbol.dispose]() {
      context.useEffect.didInitialize = true;
      context.useLayoutEffect.didInitialize = true;
      context.useRef.didInitialize = true;
      context.useCallback.didInitialize = true;
      currentContext = previousContext;
    },
  };
}

export function createComponent<P extends object, E extends HTMLElement>(
  fn: (props: P, forwardedRef: React.Ref<E>) => React.ReactNode,
) {
  const Wrapped = React.forwardRef(((props: P, forwardedRef: React.Ref<E>) => {
    const context = useRefWithInit(createContext).current;

    let result;
    try {
      currentContext = context;

      context.useEffect.index = 0;
      context.useLayoutEffect.index = 0;
      context.useRef.index = 0;
      context.useCallback.index = 0;

      result = fn(props, forwardedRef);

      context.useEffect.didInitialize = true;
      context.useLayoutEffect.didInitialize = true;
      context.useRef.didInitialize = true;
      context.useCallback.didInitialize = true;
    } catch (error) {
      throw error;
    } finally {
      currentContext = undefined;
    }

    return result;
  }) as any);
  Wrapped.displayName = (fn as any).displayName || fn.name;

  return Wrapped;
}

export const createUseEffect = (name: 'useEffect' | 'useLayoutEffect') => {
  const reactUseEffect = name === 'useEffect' ? React.useEffect : React.useLayoutEffect;

  const useEffect = (create: () => (() => void) | void, deps?: unknown[]): void => {
    const context = currentContext?.[name];

    if (!context) {
      return reactUseEffect(create, deps);
    }

    if (context.didInitialize === false) {
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
  const useRef = <T,>(initialValue?: T | null): React.MutableRefObject<T | undefined> | React.RefObject<T | null> => {
    const context = currentContext?.useRef;

    if (!context) {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return React.useRef(initialValue) as React.MutableRefObject<T | undefined>;
    }

    if (context.didInitialize === false) {
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
    const context = currentContext?.useCallback;

    if (!context) {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return React.useCallback(callback, deps);
    }

    if (context.didInitialize === false) {
      const callbackData: CallbackData<T> = { callback, deps };
      context.data.push(callbackData as CallbackData<unknown>);
      context.index += 1;
      return callback;
    }

    const callbackData = context.data[context.index] as CallbackData<T>;
    const previousDeps = callbackData.deps;

    if (previousDeps === undefined || areDepsEqual(previousDeps as unknown[], deps as unknown[]) === false) {
      callbackData.callback = callback;
      callbackData.deps = deps;
    }

    context.index += 1;
    return callbackData.callback;
  }

  return useCallback;
};
