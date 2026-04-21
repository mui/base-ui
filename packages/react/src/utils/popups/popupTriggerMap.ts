/**
 * Data structure to keep track of popup trigger elements by their IDs.
 */
export class PopupTriggerMap extends Map<string, Element> {
  /**
   * Adds a trigger element with the given ID.
   *
   * Note: The provided element is assumed to not be registered under multiple IDs.
   */
  public add(id: string, element: Element) {
    const existingElement = this.get(id);
    if (existingElement === element) {
      return;
    }

    this.set(id, element);

    if (process.env.NODE_ENV !== 'production') {
      for (const [otherId, otherElement] of this) {
        if (otherId !== id && otherElement === element) {
          throw new Error(
            'Base UI: A trigger element cannot be registered under multiple IDs in PopupTriggerMap.',
          );
        }
      }
    }
  }

  /**
   * Whether the given element is registered as a trigger.
   */
  public hasElement(element: Element): boolean {
    for (const triggerElement of this.values()) {
      if (triggerElement === element) {
        return true;
      }
    }

    return false;
  }

  /**
   * Whether there is a registered trigger element matching the given predicate.
   */
  public hasMatchingElement(predicate: (el: Element) => boolean): boolean {
    for (const element of this.values()) {
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
    return this.values();
  }
}
