import * as React from 'react';
import { useRefWithInit } from './useRefWithInit';

export type Instance = {
  didInitialize: boolean;
  index: number;
};

let currentInstance: Instance | undefined = undefined;

export function createInstance(): Instance {
  return {
    didInitialize: false,
    index: 0,
  };
}

export function getInstance() {
  return currentInstance;
}

export function setInstance(instance: Instance | undefined): void {
  currentInstance = instance;
}

export function create<P extends object>(fn: (props: P) => React.ReactNode) {
  const FastComponent = ((props: P) => {
    const instance = useRefWithInit(createInstance).current;

    let result;
    try {
      currentInstance = instance;

      instance.index = 0;

      result = fn(props);

      instance.didInitialize = true;
    } catch (error) {
      throw error;
    } finally {
      currentInstance = undefined;
    }

    return result;
  }) as any;
  FastComponent.displayName = (fn as any).displayName || fn.name;

  return FastComponent;
}

export function createRef<P extends object, E extends HTMLElement>(
  fn: (props: P, forwardedRef: React.Ref<E>) => React.ReactNode,
) {
  const FastComponent = React.forwardRef(((props: P, forwardedRef: React.Ref<E>) => {
    const instance = useRefWithInit(createInstance).current;

    let result;
    try {
      currentInstance = instance;

      instance.index = 0;

      result = fn(props, forwardedRef);

      instance.didInitialize = true;
    } catch (error) {
      throw error;
    } finally {
      currentInstance = undefined;
    }

    return result;
  }) as any);
  FastComponent.displayName = (fn as any).displayName || fn.name;

  return FastComponent;
}
