import { getComputedStyle, getNodeName, isHTMLElement, isShadowRoot } from '@floating-ui/utils/dom';
import { ownerDocument } from '@base-ui/utils/owner';
import { contains } from './element';
import { isElementVisible } from './composite';

export type FocusableElement = HTMLElement | SVGElement;

const CANDIDATE_SELECTOR =
  'a[href],button,input,select,textarea,summary,details,iframe,object,embed,[tabindex],[contenteditable]:not([contenteditable="false"]),audio[controls],video[controls]';

function getParentElement(element: Element) {
  const assignedSlot = (
    element as Element & {
      assignedSlot?: HTMLSlotElement | null | undefined;
    }
  ).assignedSlot;
  if (assignedSlot) {
    return assignedSlot;
  }

  if (element.parentElement) {
    return element.parentElement;
  }

  const rootNode = element.getRootNode();
  return isShadowRoot(rootNode) ? rootNode.host : null;
}

function getDetailsSummary(details: Element) {
  for (const child of Array.from(details.children)) {
    if (getNodeName(child) === 'summary') {
      return child;
    }
  }

  return null;
}

function isWithinOpenDetailsSummary(element: Element, details: Element) {
  const summary = getDetailsSummary(details);
  return !!summary && (element === summary || contains(summary, element));
}

function isFocusableCandidate(element: Element | null): element is FocusableElement {
  const nodeName = element ? getNodeName(element) : '';

  return (
    element != null &&
    element.matches(CANDIDATE_SELECTOR) &&
    (nodeName !== 'summary' ||
      (element.parentElement != null &&
        getNodeName(element.parentElement) === 'details' &&
        getDetailsSummary(element.parentElement) === element)) &&
    (nodeName !== 'details' || getDetailsSummary(element) == null) &&
    (nodeName !== 'input' || (element as HTMLInputElement).type !== 'hidden')
  );
}

function isFocusableElement(element: Element | null): element is FocusableElement {
  if (!isFocusableCandidate(element) || !element.isConnected || element.matches(':disabled')) {
    return false;
  }

  for (let current: Element | null = element; current; current = getParentElement(current)) {
    const isAncestor = current !== element;
    const isSlot = getNodeName(current) === 'slot';

    if (current.hasAttribute('inert')) {
      return false;
    }

    if (
      (isAncestor &&
        getNodeName(current) === 'details' &&
        !(current as HTMLDetailsElement).open &&
        !isWithinOpenDetailsSummary(element, current)) ||
      current.hasAttribute('hidden') ||
      (!isSlot && !isVisibleInTabbableTree(current, isAncestor))
    ) {
      return false;
    }
  }

  return true;
}

function isVisibleInTabbableTree(element: Element, isAncestor: boolean) {
  const styles = getComputedStyle(element);

  if (!isAncestor) {
    return isElementVisible(element, styles);
  }

  return styles.display !== 'none';
}

function getTabIndex(element: FocusableElement) {
  const tabIndex = element.tabIndex;
  if (tabIndex < 0) {
    const nodeName = getNodeName(element);
    if (
      nodeName === 'details' ||
      nodeName === 'audio' ||
      nodeName === 'video' ||
      (isHTMLElement(element) && element.isContentEditable)
    ) {
      return 0;
    }
  }

  return tabIndex;
}

function getNamedRadioInput(element: FocusableElement) {
  if (getNodeName(element) !== 'input') {
    return null;
  }

  const input = element as HTMLInputElement;
  return input.type === 'radio' && input.name !== '' ? input : null;
}

function isTabbableRadio(element: FocusableElement, candidates: FocusableElement[]) {
  const input = getNamedRadioInput(element);
  if (!input) {
    return true;
  }

  const checkedRadio = candidates.find((candidate) => {
    const radio = getNamedRadioInput(candidate);
    return radio?.name === input.name && radio.form === input.form && radio.checked;
  });

  if (checkedRadio) {
    return checkedRadio === input;
  }

  return (
    candidates.find((candidate) => {
      const radio = getNamedRadioInput(candidate);
      return radio?.name === input.name && radio.form === input.form;
    }) === input
  );
}

function getComposedChildren(container: ParentNode): Element[] {
  if (isHTMLElement(container) && getNodeName(container) === 'slot') {
    const assignedElements = (container as HTMLSlotElement).assignedElements({ flatten: true });
    if (assignedElements.length > 0) {
      return assignedElements;
    }
  }

  if (isHTMLElement(container) && container.shadowRoot) {
    return Array.from(container.shadowRoot.children);
  }

  return Array.from(container.children);
}

function appendCandidates(container: ParentNode, list: FocusableElement[]) {
  getComposedChildren(container).forEach((child) => {
    if (isFocusableCandidate(child)) {
      list.push(child);
    }

    appendCandidates(child, list);
  });
}

function appendMatchingElements(container: ParentNode, selector: string, list: HTMLElement[]) {
  getComposedChildren(container).forEach((child) => {
    if (isHTMLElement(child) && child.matches(selector)) {
      list.push(child);
    }

    appendMatchingElements(child, selector, list);
  });
}

export function isTabbable(element: Element | null) {
  return isFocusableElement(element) && getTabIndex(element) >= 0;
}

export function focusable(container: Element) {
  const candidates: FocusableElement[] = [];
  appendCandidates(container, candidates);
  return candidates.filter(isFocusableElement);
}

export function tabbable(container: Element) {
  const candidates = focusable(container);
  return candidates.filter(
    (element) => getTabIndex(element) >= 0 && isTabbableRadio(element, candidates),
  );
}

/**
 * Finds the tabbable element that sequential navigation reaches from `referenceElement`. The
 * anchor doesn't need to be tabbable itself, so a focus guard inside an `inert` subtree or with
 * `tabindex="-1"` still finds its neighbours. Elements inside any of `exclude` are skipped.
 *
 * At the end of the document, the search wraps around like the browser's tab cycle and returns
 * the anchor if nothing else is tabbable. With `wrap` set to `false`, it returns `null` instead so
 * the caller can pick a fallback. It also returns `null` if the anchor isn't in the document.
 */
export function getTabbableNearElement(
  referenceElement: Element | null,
  direction: 1 | -1,
  exclude: Array<Element | null> = [],
  wrap = true,
): FocusableElement | null {
  // Keep the anchor's composed-tree position separate from the focusable radio candidates.
  const list: FocusableElement[] = [];
  appendCandidates(ownerDocument(referenceElement).body, list);
  const index = list.indexOf(referenceElement as FocusableElement);
  if (index === -1) {
    return null;
  }

  const candidates = list.filter(isFocusableElement);
  for (let offset = 1; offset < list.length; offset += 1) {
    const position = index + direction * offset;
    const element = list[wrap ? (position + list.length) % list.length : position];
    if (!element) {
      return null;
    }
    if (
      !exclude.some((node) => contains(node, element)) &&
      isTabbable(element) &&
      isTabbableRadio(element, candidates)
    ) {
      return element;
    }
  }

  return wrap ? list[index] : null;
}

export function isOutsideEvent(event: FocusEvent | React.FocusEvent, container?: Element) {
  const containerElement = container || (event.currentTarget as Element);
  const relatedTarget = event.relatedTarget as HTMLElement | null;
  return !relatedTarget || !contains(containerElement, relatedTarget);
}

export function disableFocusInside(container: HTMLElement) {
  const tabbableElements = tabbable(container);
  tabbableElements.forEach((element) => {
    element.dataset.tabindex = element.getAttribute('tabindex') || '';
    element.setAttribute('tabindex', '-1');
  });
}

export function enableFocusInside(container: HTMLElement) {
  const elements: HTMLElement[] = [];
  appendMatchingElements(container, '[data-tabindex]', elements);
  elements.forEach((element) => {
    const tabindex = element.dataset.tabindex;
    delete element.dataset.tabindex;
    if (tabindex) {
      element.setAttribute('tabindex', tabindex);
    } else {
      element.removeAttribute('tabindex');
    }
  });
}
