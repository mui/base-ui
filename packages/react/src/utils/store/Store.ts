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

  public set<T>(key: keyof State, value: T) {
    this.update({ ...this.state, [key]: value });
  }
}
