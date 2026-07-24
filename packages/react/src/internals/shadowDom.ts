import { isShadowRoot } from '@floating-ui/utils/dom';

export function activeElement(root: Document | ShadowRoot) {
  let element = root.activeElement;

  while (element?.shadowRoot?.activeElement != null) {
    element = element.shadowRoot.activeElement;
  }

  return element;
}

/**
 * Returns the deepest active element in the element's own document or shadow
 * root. Starting from the element's root is important for closed shadow roots:
 * their focused descendant is intentionally hidden from `document.activeElement`.
 */
export function activeElementInRoot(element: Element) {
  const root = element.getRootNode();
  return activeElement(isShadowRoot(root) ? root : element.ownerDocument);
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

export function getTarget(event: Event) {
  if ('composedPath' in event) {
    return event.composedPath()[0];
  }

  // TS assumes `composedPath()` always exists, but older browsers without
  // shadow DOM support still fall back to `target`.
  return (event as Event).target;
}
