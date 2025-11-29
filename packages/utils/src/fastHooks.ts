import { useRefWithInit } from './useRefWithInit';

type Effect = {
  cleanup: (() => void) | undefined;
  create: () => (() => void) | undefined;
  deps: unknown[] | undefined;
  didChange: boolean;
};

type EffectContext = {
  index: number;
  data: Effect[];
  didInitialize: boolean;
};

type Context = {
  effects: EffectContext;
};

let currentContext: Context | undefined = undefined;

export function createContext(): Context {
  return {
    effects: {
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

export function createComponent<C extends React.FC>(component: C): C {
  const ComponentWrapper = (props: any) => {
    const context = useRefWithInit(createContext).current;

    const previousContext = currentContext;
    currentContext = context;

    context.effects.index = 0;

    try {
      return component(props);
    } finally {
      context.effects.didInitialize = true;
      currentContext = previousContext;
    }
  };
  ComponentWrapper.displayName = component.name || 'Component';

  return ComponentWrapper as C;
}

export function use(): Disposable {
  const context = useRefWithInit(createContext).current;

  const previousContext = currentContext;
  currentContext = context;

  context.effects.index = 0;

  return {
    [Symbol.dispose]() {
      context.effects.didInitialize = true;
      currentContext = previousContext;
    },
  };
}
