// Modified to add conditional `aria-hidden` support:
// https://github.com/theKashey/aria-hidden/blob/9220c8f4a4fd35f63bee5510a9f41a37264382d4/src/index.ts
import { getNodeName, isShadowRoot } from '@floating-ui/utils/dom';
import { ownerDocument } from '@base-ui/utils/owner';
import { isFocusableCandidate } from './tabbable';

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

export const correctElements = (parent: HTMLElement | ShadowRoot, targets: Element[]): Element[] =>
  targets.flatMap((target) => {
    let current = target;
    while (!parent.contains(current)) {
      const root = current.getRootNode();
      if (!isShadowRoot(root)) {
        return [];
      }
      current = root.host;
    }
    return [current];
  });

export const buildKeepSet = (targets: Element[]): Set<Node> => {
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

// Include implicit live regions as well as explicit aria-live containers.
const liveRegionSelector = '[aria-live],[role="alert"],[role="status"],[role="log"]';

export const collectOutsideElements = (
  root: HTMLElement | ShadowRoot,
  keepElements: Set<Node>,
  stopElements: Set<Node>,
  preserveLiveRegions = false,
): Element[] => {
  const liveRegions = new Set(
    preserveLiveRegions
      ? Array.from(root.querySelectorAll(liveRegionSelector)).filter(
          (element) => !isFocusableCandidate(element),
        )
      : [],
  );
  const liveAncestors = buildKeepSet(Array.from(liveRegions));
  const outside: Element[] = [];

  const walk = (parent: Element | ShadowRoot | null, insideLiveRegion = false) => {
    if (!parent || stopElements.has(parent)) {
      return;
    }

    Array.from(parent.children).forEach((node: Element) => {
      if (getNodeName(node) === 'script') {
        return;
      }

      const live = insideLiveRegion || liveRegions.has(node);
      if (
        keepElements.has(node) ||
        (!isFocusableCandidate(node) && (liveAncestors.has(node) || live))
      ) {
        // Preserve announcement text without enabling interactive descendants.
        walk(node, live);
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
      Array.from(body.querySelectorAll(liveRegionSelector)),
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
