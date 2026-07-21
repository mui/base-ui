import { isShadowRoot } from '@floating-ui/utils/dom';

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
 * Returns whether `a` comes before `b` in composed (shadow-including) document order.
 * `compareDocumentPosition` reports nodes in different shadow trees as disconnected,
 * so each node is hoisted through its shadow host chain until both representatives
 * share a root, and those representatives are compared instead.
 */
export function precedes(a: Node, b: Node): boolean {
  if (a === b) {
    return false;
  }

  const chainA = getHostChain(a);
  const chainB = getHostChain(b);

  let i = chainA.length - 1;
  let j = chainB.length - 1;
  while (i >= 0 && j >= 0 && chainA[i] === chainB[j]) {
    i -= 1;
    j -= 1;
  }

  // One chain fully matched the other's tail: that node is a shadow host ancestor
  // of the other, and a host comes before its shadow content in composed order.
  if (i < 0) {
    return true;
  }
  if (j < 0) {
    return false;
  }

  // eslint-disable-next-line no-bitwise
  return Boolean(chainA[i].compareDocumentPosition(chainB[j]) & Node.DOCUMENT_POSITION_FOLLOWING);
}

function getHostChain(node: Node): Node[] {
  const chain = [node];
  let root = node.getRootNode?.();
  while (root && isShadowRoot(root)) {
    chain.push(root.host);
    root = root.host.getRootNode();
  }
  return chain;
}

export function getTarget(event: Event) {
  if ('composedPath' in event) {
    return event.composedPath()[0];
  }

  // TS assumes `composedPath()` always exists, but older browsers without
  // shadow DOM support still fall back to `target`.
  return (event as Event).target;
}
