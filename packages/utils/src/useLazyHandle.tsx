import * as React from 'react';
import { useRefWithInit } from './useRefWithInit';

type State = {
  isActivated: boolean;
  data: unknown[];
};

const UNINITIALIZED = [] as unknown[];
const DEFAULT_HANDLE = {};

function createState() {
  return {
    isActivated: false,
    data: UNINITIALIZED,
  } as State;
}

function createContext(stateHook: [State, React.Dispatch<React.SetStateAction<State>>]) {
  let state = stateHook[0];
  const setState = stateHook[1];

  const context = {
    activate: () => {
      state = { ...state, isActivated: true };
      setState(state);
    },
    get: () => state.data,
    use,
    render: () =>
      state.isActivated ? <PhantomComponent effects={context.effects} setState={setState} /> : null,
    effects: [] as Array<() => void>,
  };

  function use(effect: () => undefined): undefined;
  function use<V>(effect: () => V, defaultValue: V): V;
  function use(effect: () => unknown, defaultValue?: unknown): unknown {
    context.effects.push(effect);
    return state.data[context.effects.length - 1] ?? defaultValue!;
  }

  return context;
}

function PhantomComponent({
  effects,
  setState,
}: {
  effects: Array<() => void>;
  setState: React.Dispatch<React.SetStateAction<State>>;
}) {
  const data = [] as unknown[];
  effects.forEach((effect) => {
    data.push(effect());
  });
  React.useEffect(() => {
    setState((prevState) => ({ ...prevState, data }));
  }, data);
  return null;
}

export function useLazyHandle<H extends Record<string, any>>(
  isActivated: boolean,
  defaultHandle?: H,
) {
  const stateHook = React.useState<State>(createState);

  if (stateHook[0].data === UNINITIALIZED) {
    stateHook[0].isActivated = isActivated;
    stateHook[0].data = defaultHandle ?? (DEFAULT_HANDLE as any);
  }
  const context = useRefWithInit(createContext, stateHook).current;

  context.effects = [];

  if (isActivated && !stateHook[0].isActivated) {
    context.activate();
  }

  return context;
}
