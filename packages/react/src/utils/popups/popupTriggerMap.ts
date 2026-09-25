/**
 * Development-only reverse index of element to registered id, keyed by the owning map.
 *
 * Registration would otherwise have to scan every entry to detect an element claimed by two ids,
 * making the mount of many triggers sharing one handle quadratic. Kept module-scoped, lazily
 * initialized, and read only from `process.env.NODE_ENV` guards so production builds drop it along
 * with the checks.
 */
let devElementIdsByMap: WeakMap<PopupTriggerMap, WeakMap<Element, string>> | undefined;

function getDevElementIds(map: PopupTriggerMap) {
  devElementIdsByMap ??= new WeakMap();

  let elementIds = devElementIdsByMap.get(map);
  if (!elementIds) {
    elementIds = new WeakMap();
    devElementIdsByMap.set(map, elementIds);
  }
  return elementIds;
}

/**
 * Data structure to keep track of popup trigger elements by their IDs.
 *
 * Element lookups iterate the id map rather than maintaining a parallel Set. Registration is O(1),
 * while `hasElement` and `hasMatchingElement` are linear in the number of triggers.
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
      const elementIds = getDevElementIds(this);

      const existingId = elementIds.get(element);
      if (existingId !== undefined && existingId !== id) {
        // TODO: fix mui/no-guarded-throw
        // eslint-disable-next-line mui/no-guarded-throw
        throw new Error(
          'Base UI: A trigger element cannot be registered under multiple IDs in PopupTriggerMap.',
        );
      }

      // Reusing an id for a different element evicts the previous one, so it must lose its claim
      // on the id or a later registration under a different id would be reported as a duplicate.
      const previousElement = this.idMap.get(id);
      if (previousElement !== undefined && previousElement !== element) {
        elementIds.delete(previousElement);
      }

      elementIds.set(element, id);
    }

    this.idMap.set(id, element);
  }

  /**
   * Removes the trigger element with the given ID.
   */
  public delete(id: string) {
    if (process.env.NODE_ENV !== 'production') {
      const element = this.idMap.get(id);
      if (element !== undefined) {
        devElementIdsByMap?.get(this)?.delete(element);
      }
    }

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
