// Modified to add conditional `aria-hidden` support:
// https://github.com/theKashey/aria-hidden/blob/9220c8f4a4fd35f63bee5510a9f41a37264382d4/src/index.ts
import { getNodeName } from '@floating-ui/utils/dom';
import { ownerDocument } from '@base-ui/utils/owner';

type Undo = () => void;

interface MarkOthersOptions {
  ariaHidden?: boolean | undefined;
  inert?: boolean | undefined;
  mark?: boolean | undefined;
  markerIgnoreElements?: Element[] | undefined;
}

const counters = {
  inert: new WeakMap<Element, number>(),
  'aria-hidden': new WeakMap<Element, number>(),
};

const markerName = 'data-base-ui-inert';

let uncontrolledElementsSet = new WeakSet<Element>();
let markerCounterMap = new WeakMap<Element, number>();
let lockCount = 0;

export const supportsInert = (): boolean =>
  typeof HTMLElement !== 'undefined' && 'inert' in HTMLElement.prototype;

const unwrapHost = (node: Element | ShadowRoot): Element | null =>
  node && ((node as ShadowRoot).host || unwrapHost(node.parentNode as Element));

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

function applyAttributeToOthers(
  uncorrectedAvoidElements: Element[],
  body: HTMLElement,
  ariaHidden: boolean,
  inert: boolean,
  { mark = true, markerIgnoreElements = [] }: MarkOthersOptions,
): Undo {
  // eslint-disable-next-line no-nested-ternary
  const controlAttribute = inert ? 'inert' : ariaHidden ? 'aria-hidden' : null;
  let counterMap: WeakMap<Element, number> | null = null;
  const avoidElements = correctElements(body, uncorrectedAvoidElements);
  const markerIgnoreSet = mark ? new Set(correctElements(body, markerIgnoreElements)) : null;
  const markerTargets = mark
    ? collectOutsideElements(body, buildKeepSet(avoidElements), new Set<Node>(avoidElements))
    : [];
  const markerTargetsToMark =
    markerIgnoreSet && markerIgnoreSet.size > 0
      ? markerTargets.filter((target) => !markerIgnoreSet.has(target))
      : markerTargets;
  const hiddenElements: Element[] = [];
  const markedElements: Element[] = [];

  if (controlAttribute) {
    const map = counters[controlAttribute];
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
        uncontrolledElementsSet.add(node);
      }

      if (!alreadyHidden) {
        node.setAttribute(controlAttribute, controlAttribute === 'inert' ? '' : 'true');
      }
    });
  }

  if (mark) {
    markerTargetsToMark.forEach((node) => {
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
          if (!uncontrolledElementsSet.has(element) && controlAttribute) {
            element.removeAttribute(controlAttribute);
          }

          uncontrolledElementsSet.delete(element);
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
      markerCounterMap = new WeakMap();
      uncontrolledElementsSet = new WeakSet();
    }
  };
}

export function markOthers(avoidElements: Element[], options: MarkOthersOptions = {}): Undo {
  const { ariaHidden = false, inert = false, mark = true, markerIgnoreElements = [] } = options;
  const body = ownerDocument(avoidElements[0]).body;
  return applyAttributeToOthers(avoidElements, body, ariaHidden, inert, {
    mark,
    markerIgnoreElements,
  });
}
