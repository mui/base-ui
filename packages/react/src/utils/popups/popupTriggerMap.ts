/**
 * Data structure to keep track of popup trigger elements by their IDs.
 * Uses the inherited Map for ID lookups and a Set mirror for efficient element lookups.
 */
export class PopupTriggerMap extends Map<string, Element> {
  private elementsSet = new Set<Element>();

  /**
   * Adds a trigger element with the given ID.
   *
   * Note: The provided element is assumed to not be registered under multiple IDs.
   */
  public add(id: string, element: Element) {
    this.set(id, element);
  }

  public set(id: string, element: Element): this {
    const existingElement = super.get(id);
    if (existingElement === element) {
      return this;
    }

    if (existingElement !== undefined) {
      // We assume that the same element won't be registered under multiple IDs.
      // This is safe considering how useTriggerRegistration is implemented.
      this.elementsSet.delete(existingElement);
    }

    this.elementsSet.add(element);
    super.set(id, element);

    if (process.env.NODE_ENV !== 'production') {
      if (this.elementsSet.size !== this.size) {
        throw new Error(
          'Base UI: A trigger element cannot be registered under multiple IDs in PopupTriggerMap.',
        );
      }
    }

    return this;
  }

  /**
   * Removes the trigger element with the given ID.
   */
  public delete(id: string): boolean {
    const element = super.get(id);
    if (element) {
      this.elementsSet.delete(element);
    }

    return super.delete(id);
  }

  public clear() {
    this.elementsSet.clear();
    super.clear();
  }

  /**
   * Whether the given element is registered as a trigger.
   */
  public hasElement(element: Element): boolean {
    return this.elementsSet.has(element);
  }

  /**
   * Whether there is a registered trigger element matching the given predicate.
   */
  public hasMatchingElement(predicate: (el: Element) => boolean): boolean {
    for (const element of this.elementsSet) {
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
    return this.get(id);
  }

  /**
   * Returns an iterable of all registered trigger elements.
   */
  public elements(): IterableIterator<Element> {
    return this.elementsSet.values();
  }
}
