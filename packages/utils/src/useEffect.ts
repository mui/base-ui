'use client';
import * as React from 'react';
import { getContext } from './fastHooks';

export const useEffect = (
  create: () => (() => void) | undefined,
  deps: unknown[] | undefined,
): void => {
  const context = getContext()?.effects;

  if (!context) {
    return React.useEffect(create, deps);
  }

  if (context.didInitialize === false) {
    context.data.push({
      create,
      cleanup: undefined,
      deps,
      didChange: true,
    });
  } else {
    const effect = context.data[context.index];
    const previousDeps = effect.deps;
    const currentDeps = deps;

    effect.didChange =
      effect.didChange ||
      currentDeps === undefined ||
      previousDeps === undefined ||
      areDepsEqual(previousDeps, currentDeps) === false;
    effect.create = create;
    effect.deps = deps;
  }

  context.index += 1;

  if (context.index === 1) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useEffect(() => {
      for (const effect of context.data) {
        if (effect.didChange) {
          effect.didChange = false;
          effect.cleanup = effect.create();
        }
      }
      return () => {
        for (const effect of context.data) {
          if (effect.didChange) {
            effect.cleanup?.();
          }
        }
      };
    });
  }
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
