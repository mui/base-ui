import { isShadowRoot, isElement } from '@floating-ui/utils/dom';

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
 * Shadow DOM-safe version of `Element.closest()`. Searches ancestors within the
 * starting element's shadow root first, then crosses each shadow boundary and
 * repeats until a match is found or the document root is reached.
 */
export function closest(element: Element | null, selector: string): Element | null {
  let current = element;
  while (current) {
    const match = current.closest(selector);
    if (match) {
      return match;
    }
    const root = current.getRootNode();
    current = isShadowRoot(root) && isElement(root.host) ? (root.host as Element) : null;
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
