import { tabbable, type FocusableElement } from 'tabbable';
import { activeElement, contains, getDocument } from './element';

export const getTabbableOptions = () =>
  ({
    getShadowRoot: true,
    displayCheck:
      // JSDOM does not support the `tabbable` library. To solve this we can
      // check if `ResizeObserver` is a real function (not polyfilled), which
      // determines if the current environment is JSDOM-like.
      typeof ResizeObserver === 'function' && ResizeObserver.toString().includes('[native code]')
        ? 'full'
        : 'none',
  }) as const;

function getTabbableIn(container: HTMLElement, dir: 1 | -1): FocusableElement | undefined {
  const list = tabbable(container, getTabbableOptions());
  const len = list.length;
  if (len === 0) {
    return undefined;
  }

  const active = activeElement(getDocument(container)) as FocusableElement;
  const index = list.indexOf(active);
  // eslint-disable-next-line no-nested-ternary
  const nextIndex = index === -1 ? (dir === 1 ? 0 : len - 1) : index + dir;

  return list[nextIndex];
}

export function getNextTabbable(referenceElement: Element | null): FocusableElement | null {
  return (
    getTabbableIn(getDocument(referenceElement).body, 1) || (referenceElement as FocusableElement)
  );
}

export function getPreviousTabbable(referenceElement: Element | null): FocusableElement | null {
  return (
    getTabbableIn(getDocument(referenceElement).body, -1) || (referenceElement as FocusableElement)
  );
}

function getTabbableNearElement(referenceElement: Element | null, dir: 1 | -1) {
  if (!referenceElement) {
    return null;
  }

  const list = tabbable(getDocument(referenceElement).body, getTabbableOptions());
  const elementCount = list.length;
  if (elementCount === 0) {
    return null;
  }

  const index = list.indexOf(referenceElement as FocusableElement);
  if (index === -1) {
    return null;
  }

  const nextIndex = (index + dir + elementCount) % elementCount;
  return list[nextIndex];
}

export function getTabbableAfterElement(referenceElement: Element | null): FocusableElement | null {
  return getTabbableNearElement(referenceElement, 1);
}

export function getTabbableBeforeElement(
  referenceElement: Element | null,
): FocusableElement | null {
  return getTabbableNearElement(referenceElement, -1);
}

export function isOutsideEvent(event: FocusEvent | React.FocusEvent, container?: Element) {
  const containerElement = container || (event.currentTarget as Element);
  const relatedTarget = event.relatedTarget as HTMLElement | null;
  return !relatedTarget || !contains(containerElement, relatedTarget);
}

export function disableFocusInside(container: HTMLElement) {
  const tabbableElements = tabbable(container, getTabbableOptions());
  tabbableElements.forEach((element) => {
    element.dataset.tabindex = element.getAttribute('tabindex') || '';
    element.setAttribute('tabindex', '-1');
  });
}

export function enableFocusInside(container: HTMLElement) {
  const elements = container.querySelectorAll<HTMLElement>('[data-tabindex]');
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
