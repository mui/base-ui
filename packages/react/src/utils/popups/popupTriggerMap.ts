/**
 * Data structure to keep track of popup trigger elements by their IDs.
 *
 * Element lookups iterate the id map; trigger counts are single digits, so linear
 * scans on event-frequency paths are cheaper than maintaining a parallel Set.
 */
export class PopupTriggerMap {
  private idMap: Map<string, Element>;

  constructor() {
    this.idMap = new Map();
  }

  /**
   * Adds a trigger element with the given ID.
   *
   * Note: The provided element is assumed to not be registered under multiple IDs.
   */
  public add(id: string, element: Element) {
    if (process.env.NODE_ENV !== 'production') {
      for (const [existingId, existingElement] of this.idMap) {
        if (existingElement === element && existingId !== id) {
          // TODO: fix mui/no-guarded-throw
          // eslint-disable-next-line mui/no-guarded-throw
          throw new Error(
            'Base UI: A trigger element cannot be registered under multiple IDs in PopupTriggerMap.',
          );
        }
      }
    }

    this.idMap.set(id, element);
  }

  /**
   * Removes the trigger element with the given ID.
   */
  public delete(id: string) {
    this.idMap.delete(id);
  }

  /**
   * Whether the given element is registered as a trigger.
   */
  public hasElement(element: Element): boolean {
    for (const registered of this.idMap.values()) {
      if (registered === element) {
        return true;
      }
    }

    return false;
  }

  /**
   * Whether there is a registered trigger element matching the given predicate.
   */
  public hasMatchingElement(predicate: (el: Element) => boolean): boolean {
    for (const element of this.idMap.values()) {
      if (predicate(element)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Returns the trigger element associated with the given ID, or undefined if no such element exists.
   */
  public getById(id: string): Element | undefined {
    return this.idMap.get(id);
  }

  /**
   * Returns an iterable of all registered trigger entries, where each entry is a tuple of [id, element].
   */
  public entries(): IterableIterator<[string, Element]> {
    return this.idMap.entries();
  }

  /**
   * Returns an iterable of all registered trigger elements.
   */
  public elements(): IterableIterator<Element> {
    return this.idMap.values();
  }

  /**
   * Returns the number of registered trigger elements.
   */
  public get size(): number {
    return this.idMap.size;
  }
}
