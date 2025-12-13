import * as React from 'react';
import { useRefWithInit } from './useRefWithInit';

function PhantomComponent({ effects }: { effects: Array<() => void> }) {
  effects.forEach((effect) => effect());
  return null;
}

type State<H extends Record<string, any>> = {
  isActivated: boolean;
  handle: H;
};

const UNINITIALIZED = {};
const DEFAULT_HANDLE = {};

function createState() {
  return {
    isActivated: false,
    handle: UNINITIALIZED,
  } as State<any>;
}

function createContext<H extends Record<string, any>>(
  stateHook: [State<H>, React.Dispatch<React.SetStateAction<State<H>>>],
) {
  let state = stateHook[0];
  const setState = stateHook[1];

  const context = {
    activate: () => {
      state = { ...state, isActivated: true };
      setState(state);
    },
    get: () => state.handle,
    set: <K extends keyof H>(key: K, value: H[K]) => {
      if ((state.handle as any)[key] !== value) {
        state = { ...state, handle: { ...state.handle, [key]: value } };
        setState(state);
      }
    },
    use: (effect: () => void) => {
      context.effects.push(effect);
    },
    render: () => (state.isActivated ? <PhantomComponent effects={context.effects} /> : null),
    effects: [] as Array<() => void>,
  };

  return context;
}

export function useLazyHandle<H extends Record<string, any>>(
  isActivated: boolean,
  defaultHandle?: H,
) {
  const stateHook = React.useState<State<H>>(createState);

  if (stateHook[0].handle === UNINITIALIZED) {
    stateHook[0].isActivated = isActivated;
    stateHook[0].handle = defaultHandle ?? (DEFAULT_HANDLE as any);
  }
  const context = useRefWithInit(createContext, stateHook).current;

  context.effects = [];

  if (isActivated && !stateHook[0].isActivated) {
    context.activate();
  }

  return context;
}
