import { isShadowRoot } from '@floating-ui/utils/dom';

/**
 * Returns an element's parent in the composed tree, including assigned slots and
 * shadow hosts.
 */
export function getParentElement(element: Element): Element | null {
  if (element.assignedSlot) {
    return element.assignedSlot;
  }

  if (element.parentElement) {
    return element.parentElement;
  }

  const root = element.getRootNode();
  return isShadowRoot(root) ? root.host : null;
}
