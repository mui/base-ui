// Modified to add conditional `aria-hidden` support:
// https://github.com/theKashey/aria-hidden/blob/9220c8f4a4fd35f63bee5510a9f41a37264382d4/src/index.ts
import { getNodeName, isShadowRoot } from '@floating-ui/utils/dom';
import { ownerDocument } from '@base-ui/utils/owner';
import { CANDIDATE_SELECTOR } from './tabbable';

type Undo = () => void;

interface MarkOthersOptions {
  ariaHidden?: boolean | undefined;
  mark?: boolean | undefined;
}

const markerName = 'data-base-ui-inert';

let ariaHiddenCounterMap = new WeakMap<Element, number>();
let uncontrolledElementsSet = new WeakSet<Element>();
let markerCounterMap = new WeakMap<Element, number>();
let lockCount = 0;

function unwrapHost(node: Node | null): Element | null {
  if (!node) {
    return null;
  }

  return isShadowRoot(node) ? node.host : unwrapHost(node.parentNode);
}

const correctElements = (parent: HTMLElement, targets: Element[]): Element[] =>
  targets
    .map((target) => {
      if (parent.contains(target)) {
        return target;
      }

      const correctedTarget = unwrapHost(target);

      if (parent.contains(correctedTarget)) {
        return correctedTarget;
      }

      return null;
    })
    .filter((x): x is Element => x != null);

const buildKeepSet = (targets: Element[]): Set<Node> => {
  const keep = new Set<Node>();

  targets.forEach((target) => {
    let node: Node | null = target;
    while (node && !keep.has(node)) {
      keep.add(node);
      node = node.parentNode;
    }
  });

  return keep;
};

const collectOutsideElements = (
  root: HTMLElement,
  keepElements: Set<Node>,
  stopElements: Set<Node>,
): Element[] => {
  const outside: Element[] = [];

  const walk = (parent: Element | null) => {
    if (!parent || stopElements.has(parent)) {
      return;
    }

    Array.from(parent.children).forEach((node: Element) => {
      if (getNodeName(node) === 'script') {
        return;
      }

      if (keepElements.has(node)) {
        walk(node);
      } else {
        outside.push(node);
      }
    });
  };

  walk(root);

  return outside;
};

type TabIndexRestoreEntry = [element: Element, originalTabIndex: string | null];
const focusRestoreMap = new WeakMap<Element, TabIndexRestoreEntry[]>();

/**
 * Function to remove focusable elements from tab order
 */
function removeFromTabOrder(node: Element): TabIndexRestoreEntry[] {
  const targets: Element[] = []; // Init targets array

  // Push original node if focusable
  if (node.matches?.(CANDIDATE_SELECTOR)) {
    targets.push(node);
  }
  // Push focusable descendent nodes
  if (node.querySelectorAll) {
    targets.push(...node.querySelectorAll(CANDIDATE_SELECTOR));
  }

  const restore: TabIndexRestoreEntry[] = []; // Init to restore array

  // Loop through tabbable target elements in tree
  targets.forEach((element) => {
    // Skip target if disabled
    if (element.matches(':disabled')) {
      return;
    }
    const tabIndex = element.getAttribute('tabindex');

    // Negative tabIndex already removes element from tab order
    if (tabIndex !== null && Number(tabIndex) < 0) {
      return;
    }

    restore.push([element, tabIndex]); // Store element for later tab index restore
    element.setAttribute('tabindex', '-1'); // Hide element from tab sequence
  });

  return restore;
}

/**
 * Function to restore tab order state to altered elements
 */
function restoreTabOrder(node: Element): void {
  const restore = focusRestoreMap.get(node); // Retrieve element restore values
  if (!restore) {
    return;
  }

  focusRestoreMap.delete(node); // Delete this node from restore map

  // Loop through tabIndex restore entries for this node
  restore.forEach(([element, tabIndex]) => {
    // Only restore if -1 rewrite still active
    if (element.getAttribute('tabindex') !== '-1') {
      return;
    }
    // Restore previous tab index
    if (tabIndex === null) {
      element.removeAttribute('tabindex');
    } else {
      element.setAttribute('tabindex', tabIndex);
    }
  });
}

function applyAttributeToOthers(
  uncorrectedAvoidElements: Element[],
  body: HTMLElement,
  ariaHidden: boolean,
  { mark = true }: MarkOthersOptions,
): Undo {
  const avoidElements = correctElements(body, uncorrectedAvoidElements);
  const markerTargets = mark
    ? collectOutsideElements(body, buildKeepSet(avoidElements), new Set<Node>(avoidElements))
    : [];
  const hiddenElements: Element[] = [];
  const markedElements: Element[] = [];

  if (ariaHidden) {
    const ariaLiveElements = correctElements(
      body,
      Array.from(body.querySelectorAll('[aria-live]')),
    );
    const controlElements = avoidElements.concat(ariaLiveElements);
    const controlTargets = collectOutsideElements(
      body,
      buildKeepSet(controlElements),
      new Set<Node>(controlElements),
    );

    controlTargets.forEach((node) => {
      const attr = node.getAttribute('aria-hidden');
      const alreadyHidden = attr !== null && attr !== 'false';
      const counterValue = (ariaHiddenCounterMap.get(node) || 0) + 1;

      ariaHiddenCounterMap.set(node, counterValue);
      hiddenElements.push(node);

      if (counterValue === 1 && alreadyHidden) {
        uncontrolledElementsSet.add(node);
      }

      if (!alreadyHidden) {
        node.setAttribute('aria-hidden', 'true');
      }
      if (counterValue === 1 && !alreadyHidden) {
        focusRestoreMap.set(node, removeFromTabOrder(node));
      }
    });
  }

  if (mark) {
    markerTargets.forEach((node) => {
      const markerValue = (markerCounterMap.get(node) || 0) + 1;

      markerCounterMap.set(node, markerValue);
      markedElements.push(node);

      if (markerValue === 1) {
        node.setAttribute(markerName, '');
      }
    });
  }

  lockCount += 1;

  return () => {
    hiddenElements.forEach((element) => {
      const counterValue = (ariaHiddenCounterMap.get(element) || 0) - 1;
      ariaHiddenCounterMap.set(element, counterValue);

      if (!counterValue) {
        if (!uncontrolledElementsSet.has(element)) {
          element.removeAttribute('aria-hidden');
        }

        uncontrolledElementsSet.delete(element);
        restoreTabOrder(element);
      }
    });

    if (mark) {
      markedElements.forEach((element) => {
        const markerValue = (markerCounterMap.get(element) || 0) - 1;

        markerCounterMap.set(element, markerValue);

        if (!markerValue) {
          element.removeAttribute(markerName);
        }
      });
    }

    lockCount -= 1;

    if (!lockCount) {
      ariaHiddenCounterMap = new WeakMap();
      uncontrolledElementsSet = new WeakSet();
      markerCounterMap = new WeakMap();
    }
  };
}

export function markOthers(avoidElements: Element[], options: MarkOthersOptions = {}): Undo {
  const { ariaHidden = false, mark = true } = options;
  const body = ownerDocument(avoidElements[0]).body;
  return applyAttributeToOthers(avoidElements, body, ariaHidden, { mark });
}
