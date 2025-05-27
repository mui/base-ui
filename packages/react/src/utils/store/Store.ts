type Listener<T> = (state: T) => void;

export class Store<State> {
  public state: State;

  private listeners: Set<Listener<State>>;

  constructor(state: State) {
    this.state = state;
    this.listeners = new Set();
  }

  public subscribe = (fn: Listener<State>) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };

  public getSnapshot = () => {
    return this.state;
  };

  public update = (newState: State) => {
    if (this.state !== newState) {
      this.state = newState;
      this.listeners.forEach((l) => l(newState));
    }
  };

  public apply(changes: Partial<State>) {
    applyUpdate: for (;;) {
      for (const key in changes) {
        if (!Object.is(this.state[key], changes[key])) {
          break applyUpdate;
        }
      }
      return;
    }
    this.update({ ...this.state, ...changes });
  }

  public set<T>(key: keyof State, value: T) {
    if (!Object.is(this.state[key], value)) {
      this.update({ ...this.state, [key]: value });
    }
  }
}
