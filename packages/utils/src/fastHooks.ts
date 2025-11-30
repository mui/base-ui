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

type Context = {
  useEffect: EffectContext;
  useLayoutEffect: EffectContext;
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

  return {
    [Symbol.dispose]() {
      context.useEffect.didInitialize = true;
      context.useLayoutEffect.didInitialize = true;
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

      result = fn(props, forwardedRef);

      context.useEffect.didInitialize = true;
      context.useLayoutEffect.didInitialize = true;
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

function areDepsEqual(depsA: unknown[], depsB: unknown[]): boolean {
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
