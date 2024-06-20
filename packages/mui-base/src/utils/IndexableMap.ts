/* eslint-disable no-restricted-syntax */
export class IndexableMap<Key, Value> {
  #map: Map<Key, Value>;

  #index: Key[];

  constructor(entries?: Iterable<readonly [Key, Value]> | null) {
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

  entries(): IterableIterator<[Key, Value]> {
    return this.#map.entries();
  }

  [Symbol.iterator](): IterableIterator<[Key, Value]> {
    return this.#map.entries();
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

  delete(key: Key) {
    if (this.#map.has(key)) {
      this.#map.delete(key);
      this.#index.splice(this.#index.indexOf(key), 1);
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

  first(predicate: (value: Value) => boolean): Value | undefined {
    for (const value of this.#map.values()) {
      if (predicate(value)) {
        return value;
      }
    }

    return undefined;
  }

  last(predicate: (value: Value) => boolean): Value | undefined {
    let lastValue: Value | undefined;
    for (const value of this.#map.values()) {
      if (predicate(value)) {
        lastValue = value;
      }
    }

    return lastValue;
  }

  static areEqual<K, V>(map1: IndexableMap<K, V>, map2: IndexableMap<K, V>): boolean {
    if (map1.size !== map2.size) {
      return false;
    }

    for (const key of map1.keys()) {
      if (map1.get(key) !== map2.get(key)) {
        return false;
      }
    }

    return true;
  }
}
