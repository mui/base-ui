import { contains } from '@base-ui/utils/shadowDom';
import { ownerWindow } from '@base-ui/utils/owner';
import { getComposedChildren, getComposedParentElement } from '../../utils/popups/focus/tabbable';

function hasExcludedAncestor(element: HTMLElement, container: HTMLElement): boolean {
  for (
    let current: Element | null = element;
    current;
    current = getComposedParentElement(current)
  ) {
    if (
      current.hasAttribute('hidden') ||
      current.hasAttribute('inert') ||
      current.getAttribute('aria-hidden') === 'true'
    ) {
      return true;
    }

    if (
      current !== element &&
      current.localName === 'details' &&
      !(current as HTMLDetailsElement).open
    ) {
      // A closed `<details>` still shows its summary.
      const summary = Array.from(current.children).find((child) => child.localName === 'summary');
      if (summary == null || !contains(summary, element)) {
        return true;
      }
    }

    const styles = ownerWindow(current).getComputedStyle(current);
    if (
      styles.display === 'none' ||
      styles.visibility === 'hidden' ||
      styles.visibility === 'collapse'
    ) {
      return true;
    }

    if (current === container) {
      break;
    }
  }

  return false;
}

/**
 * Whether a registered row control can receive focus: it is still in the row, not
 * natively disabled (including through a disabled `<fieldset>`), and not hidden.
 */
export function isControlFocusable(element: HTMLElement, container: HTMLElement): boolean {
  return (
    element.isConnected &&
    contains(container, element) &&
    !element.matches(':disabled') &&
    !hasExcludedAncestor(element, container)
  );
}

/**
 * Visits the elements of the composed tree of `container` depth-first, following
 * open shadow roots and slot assignment, which is the order Tab visits them in.
 * Stops once `visit` returns `true`.
 */
function walkComposedTree(container: ParentNode, visit: (element: Element) => boolean | void) {
  const visited = new Set<Element>();
  const walk = (parent: ParentNode): boolean => {
    for (const child of getComposedChildren(parent)) {
      if (!visited.has(child)) {
        visited.add(child);
        if (visit(child) === true || walk(child)) {
          return true;
        }
      }
    }
    return false;
  };
  walk(container);
}

/** Orders `items` by where their element appears in the composed tree of `container`. */
export function sortInComposedOrder<T extends { element: Element }>(
  container: HTMLElement,
  items: T[],
): T[] {
  if (items.length < 2) {
    return items;
  }
  const itemByElement = new Map(items.map((item) => [item.element, item]));
  const ordered: T[] = [];
  walkComposedTree(container, (child) => {
    const item = itemByElement.get(child);
    if (item !== undefined) {
      ordered.push(item);
    }
    return ordered.length === items.length;
  });
  if (ordered.length < items.length) {
    // Elements the traversal can't reach, such as inside a closed shadow root, go last.
    for (const item of items) {
      if (!ordered.includes(item)) {
        ordered.push(item);
      }
    }
  }
  return ordered;
}
