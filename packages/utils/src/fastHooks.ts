import * as React from 'react';
import { useRefWithInit } from './useRefWithInit';

export type Instance = {
  didInitialize: boolean;
};

type HookType = {
  before: (instance: any) => void;
  after: (instance: any) => void;
};

const hooks: HookType[] = [];

let currentInstance: Instance | undefined = undefined;

export function getInstance() {
  return currentInstance;
}

export function setInstance(instance: Instance | undefined): void {
  currentInstance = instance;
}

export function register(hook: HookType): void {
  hooks.push(hook);
}

export function create<P extends object, E extends HTMLElement>(fn: (props: P) => React.ReactNode) {
  const FastComponent = (props: P, forwardedRef: React.Ref<E>) => {
    const instance = useRefWithInit(createInstance).current;

    let result;
    try {
      currentInstance = instance;

      for (const hook of hooks) {
        hook.before(instance);
      }

      result = (fn as any)(props, forwardedRef);

      for (const hook of hooks) {
        hook.after(instance);
      }

      instance.didInitialize = true;
    } finally {
      currentInstance = undefined;
    }

    return result;
  };
  FastComponent.displayName = (fn as any).displayName || fn.name;
  return FastComponent;
}

export function createRef<P extends object, E extends HTMLElement>(
  fn: (props: P, forwardedRef: React.Ref<E>) => React.ReactNode,
): (props: P, forwardedRef: React.Ref<E>) => React.ReactNode {
  return React.forwardRef<E, P>(create(fn as any)) as any;
}

function createInstance(): Instance {
  return {
    didInitialize: false,
  };
}
