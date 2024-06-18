/* eslint-disable no-restricted-syntax */
export class IndexableMap<Key, Value> {
  #map: Map<Key, Value>;

  #index: Key[];

  constructor(entries?: Iterable<readonly [Key, Value]>) {
    if (entries) {
      this.#map = new Map(entries);
      this.#index = Array.from(this.#map.keys());
    } else {
      this.#map = new Map();
      this.#index = [];
    }
  }

  get size(): number {
    return this.#map.size;
  }

  keys(): IterableIterator<Key> {
    return this.#map.keys();
  }

  values(): IterableIterator<Value> {
    return this.#map.values();
  }

  get(key: Key): Value | undefined {
    return this.#map.get(key);
  }

  set(key: Key, value: Value) {
    if (!this.#map.has(key)) {
      this.#map.set(key, value);
      this.#index.push(key);
    }
  }

  elementAt(index: number): Value | undefined {
    return this.#map.get(this.#index[index]);
  }

  indexOf(key: Key): number {
    return this.#index.indexOf(key);
  }

  every(predicate: (value: Value) => boolean): boolean {
    for (const value of this.#map.values()) {
      if (!predicate(value)) {
        return false;
      }
    }

    return true;
  }

  some(predicate: (value: Value) => boolean): boolean {
    for (const value of this.#map.values()) {
      if (predicate(value)) {
        return true;
      }
    }

    return false;
  }
}
