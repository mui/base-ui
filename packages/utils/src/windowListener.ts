type Events = keyof WindowEventMap;
type Options = string;
type State = ReturnType<typeof createState>;

function createState() {
  return new Map<Events, Map<Options, Set<Function>>>();
}

/**
 * Adds an event listener to the window, ensuring that multiple listeners of the same
 * type and options are not added more than once.
 * WARNING: Event listeners are never removed from the window. Might not be suitable
 * for events like 'mousemove'.
 */
export function add<K extends Events>(
  win: Window,
  type: K,
  listener: (this: Window, ev: WindowEventMap[K]) => any,
  options?: boolean | AddEventListenerOptions,
) {
  if ((win as any).baseUIListeners === undefined) {
    Object.defineProperty(win, 'baseUIListeners', {
      value: createState(),
      configurable: false,
      enumerable: false,
      writable: false,
    });
  }
  const state = (win as any).baseUIListeners as State;
  let eventState = state.get(type);
  if (!eventState) {
    eventState = new Map<Options, Set<Function>>();
    state.set(type, eventState);
  }
  const optionKey = options ? JSON.stringify(options) : 'default';
  let listeners = eventState.get(optionKey);
  if (!listeners) {
    listeners = new Set<Function>();
    eventState.set(optionKey, listeners);
  }

  if (listeners.size === 0) {
    win.addEventListener(
      type,
      (event) => {
        for (const listener of listeners) {
          (listener as any).call(win, event);
        }
      },
      options,
    );
  }

  listeners.add(listener);
}

export function remove<K extends Events>(
  win: Window,
  type: K,
  listener: (this: Window, ev: WindowEventMap[K]) => any,
  options?: boolean | AddEventListenerOptions,
) {
  const state = (win as any).baseUIListeners as State;
  if (!state) {
    return;
  }
  const eventState = state.get(type);
  if (!eventState) {
    return;
  }
  const optionKey = options ? JSON.stringify(options) : 'default';
  const listeners = eventState.get(optionKey);
  if (!listeners) {
    return;
  }
  listeners.delete(listener);
}
