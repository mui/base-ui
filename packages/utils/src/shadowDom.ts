import { getParentNode, isElement, isShadowRoot } from '@floating-ui/utils/dom';

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

/** Finds the closest matching element in the composed tree, crossing slots and shadow roots. */
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

    const parent = getParentNode(current);
    if (parent === current) {
      return null;
    }
    current = parent;
  }

  return null;
}

export function getTarget(event: Event) {
  if ('composedPath' in event) {
    return event.composedPath()[0];
  }

  // TS assumes `composedPath()` always exists, but older browsers without
  // shadow DOM support still fall back to `target`.
  return (event as Event).target;
}
