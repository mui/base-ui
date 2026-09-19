import { isElement, isShadowRoot } from '@floating-ui/utils/dom';

export function activeElement(doc: Document) {
  let element = doc.activeElement;

  while (element?.shadowRoot?.activeElement != null) {
    element = element.shadowRoot.activeElement;
  }

  return element;
}

export function contains(parent?: Element | null, child?: Element | null) {
  if (!parent || !child) {
    return false;
  }

  const rootNode = child.getRootNode?.();

  // First, attempt with the faster native method.
  if (parent.contains(child)) {
    return true;
  }

  // Then fall back to traversing out of shadow roots when needed.
  if (rootNode && isShadowRoot(rootNode)) {
    let next = child;
    while (next) {
      if (parent === next) {
        return true;
      }
      next = (next.parentNode as Element) || (next as unknown as ShadowRoot).host;
    }
  }

  return false;
}

/**
 * Finds the closest matching element in the composed tree, crossing slots and shadow roots.
 * `:scope` is not supported.
 */
export function closest<K extends keyof HTMLElementTagNameMap>(
  node: Node | null | undefined,
  selector: K,
): HTMLElementTagNameMap[K] | null;
export function closest<K extends keyof SVGElementTagNameMap>(
  node: Node | null | undefined,
  selector: K,
): SVGElementTagNameMap[K] | null;
export function closest<E extends Element = Element>(
  node: Node | null | undefined,
  selector: string,
): E | null;
export function closest(node: Node | null | undefined, selector: string): Element | null {
  let current = node;

  while (current) {
    if (isElement(current) && current.matches(selector)) {
      return current;
    }

    current =
      (current as Element).assignedSlot ??
      current.parentNode ??
      (isShadowRoot(current) ? current.host : null);
  }

  return null;
}

export function getTarget(event: Event) {
  if ('composedPath' in event) {
    // The composed path is empty once the event is no longer being dispatched,
    // so fall back to `target` for handlers running after dispatch completes.
    return event.composedPath()[0] ?? event.target;
  }

  // TS assumes `composedPath()` always exists, but older browsers without
  // shadow DOM support still fall back to `target`.
  return (event as Event).target;
}
