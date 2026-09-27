// Modified to add conditional `aria-hidden` support:
// https://github.com/theKashey/aria-hidden/blob/9220c8f4a4fd35f63bee5510a9f41a37264382d4/src/index.ts
import { getNodeName, isShadowRoot } from '@floating-ui/utils/dom';
import { ownerDocument } from '@base-ui/utils/owner';

type Undo = () => void;

interface MarkOthersOptions {
  ariaHidden?: boolean | undefined;
  inert?: boolean | undefined;
  mark?: boolean | undefined;
}

const counters = {
  inert: new WeakMap<Element, number>(),
  'aria-hidden': new WeakMap<Element, number>(),
};

const markerName = 'data-base-ui-inert';
type ControlAttribute = keyof typeof counters;

const uncontrolledElementsSets: Record<ControlAttribute, WeakSet<Element>> = {
  inert: new WeakSet<Element>(),
  'aria-hidden': new WeakSet<Element>(),
};
let markerCounterMap = new WeakMap<Element, number>();
let lockCount = 0;

function getUncontrolledElementsSet(controlAttribute: ControlAttribute) {
  return uncontrolledElementsSets[controlAttribute];
}

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

// TODO investigate importing from packages/react/src/floating-ui-react/utils/tabbable.ts for SST
const focusableSelector = ['a[href]', 'area[href]', 'input:not([disabled])', 'select:not([disabled])', 'textarea:not([disabled])', 'button:not([disabled])', 'iframe', 'audio[controls]', 'video[controls]', '[contenteditable]:not([contenteditable="false"])', '[tabindex]'].join(',');

/**
 * Function to remove focusable elements from tab order
 * TODO exempt natural next-tabbable neighbor in FloatingFocusManager/insideElements? Investigate untrapped combobox case
 */
function removeFromTabOrder(node: Element): TabIndexRestoreEntry[] {
  const targets: Element[] = [] // Init targets array

  // Push original node if focusable
  if (node.matches?.(focusableSelector)) {
    targets.push(node)
  }
  // Push focusable descendent nodes
  if (node.querySelectorAll) {
    targets.push(...node.querySelectorAll(focusableSelector))
  }
  const restore: TabIndexRestoreEntry[] = []; // Init to restore array

  // Loop through tabbable target elements in tree
  targets.forEach(element => {
    const tabIndex = element.getAttribute('tabindex')

    // TODO investigate handling of existing negative tabIndex values, maybe skip eg -2
    if (tabIndex === '-1') {
      return
    }
    restore.push([element, tabIndex]);
    element.setAttribute('tabindex', '-1')
  })
  return restore;
}


/**
 * Function to restore tab order state to altered elements
 */
function restoreTabOrder(node: Element): void {
  const restore = focusRestoreMap.get(node);
  if (!restore) {
    return;
  }
  focusRestoreMap.delete(node); // TODO here or after complete?

  // Loop through tabIndex restore entries
  restore.forEach(([element, tabIndex]) => {
    if (element.getAttribute('tabindex') !== '-1') {
      return;
    }
    if (tabIndex === null) {
      element.removeAttribute('tabindex');
    } else {
      element.setAttribute('tabindex', tabIndex)
    }
  })
}

function applyAttributeToOthers(
  uncorrectedAvoidElements: Element[],
  body: HTMLElement,
  ariaHidden: boolean,
  inert: boolean,
  { mark = true }: MarkOthersOptions,
): Undo {
  let controlAttribute: ControlAttribute | null = null;
  if (inert) {
    controlAttribute = 'inert';
  } else if (ariaHidden) {
    controlAttribute = 'aria-hidden';
  }

  let counterMap: WeakMap<Element, number> | null = null;
  let uncontrolledElementsSet: WeakSet<Element> | null = null;
  const avoidElements = correctElements(body, uncorrectedAvoidElements);
  const markerTargets = mark
    ? collectOutsideElements(body, buildKeepSet(avoidElements), new Set<Node>(avoidElements))
    : [];
  const hiddenElements: Element[] = [];
  const markedElements: Element[] = [];

  if (controlAttribute) {
    const map = counters[controlAttribute];
    const currentUncontrolledElementsSet = getUncontrolledElementsSet(controlAttribute);
    uncontrolledElementsSet = currentUncontrolledElementsSet;
    counterMap = map;
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
      const attr = node.getAttribute(controlAttribute);
      const alreadyHidden = attr !== null && attr !== 'false';
      const counterValue = (map.get(node) || 0) + 1;

      map.set(node, counterValue);
      hiddenElements.push(node);

      if (counterValue === 1 && alreadyHidden) {
        currentUncontrolledElementsSet.add(node);
      }

      if (!alreadyHidden) {
        node.setAttribute(controlAttribute, controlAttribute === 'inert' ? '' : 'true');
      }
      if (controlAttribute === 'aria-hidden' && counterValue === 1 && !alreadyHidden) {
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
    if (counterMap) {
      hiddenElements.forEach((element) => {
        const currentCounterValue = counterMap.get(element) || 0;
        const counterValue = currentCounterValue - 1;
        counterMap.set(element, counterValue);

        if (!counterValue) {
          if (!uncontrolledElementsSet?.has(element) && controlAttribute) {
            element.removeAttribute(controlAttribute);
          }

          uncontrolledElementsSet?.delete(element);
          restoreTabOrder(element)
        }
      });
    }

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
      counters.inert = new WeakMap();
      counters['aria-hidden'] = new WeakMap();
      uncontrolledElementsSets.inert = new WeakSet();
      uncontrolledElementsSets['aria-hidden'] = new WeakSet();
      markerCounterMap = new WeakMap();
    }
  };
}

export function markOthers(avoidElements: Element[], options: MarkOthersOptions = {}): Undo {
  const { ariaHidden = false, inert = false, mark = true } = options;
  const body = ownerDocument(avoidElements[0]).body;
  return applyAttributeToOthers(avoidElements, body, ariaHidden, inert, { mark });
}
