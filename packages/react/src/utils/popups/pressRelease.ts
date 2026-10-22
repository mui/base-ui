'use client';
import * as React from 'react';
import { getParentNode, isHTMLElement, isLastTraversableNode } from '@floating-ui/utils/dom';
import { contains, getTarget } from '@base-ui/utils/shadowDom';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { isMouseWithinBounds } from '../getPseudoElementBounds';

export interface PressReleaseInsideOptions {
  /**
   * Elements the press can be released in.
   */
  elements: ReadonlyArray<Element | null | undefined>;
  /**
   * Releases within this element's bounds, with a small tolerance for pointer drift, also count.
   */
  boundsElement?: HTMLElement | null | undefined;
  /**
   * Releases inside any popup of the menu tree with this root id also count.
   */
  rootId?: string | undefined;
}

/**
 * Whether the `mouseup` ending the press that opened a popup landed inside it, in which case the
 * open shouldn't be canceled.
 */
export function isPressReleasedInside(event: MouseEvent, options: PressReleaseInsideOptions) {
  const target = getTarget(event) as Element | null;

  if (options.elements.some((element) => contains(element, target))) {
    return true;
  }

  if (options.rootId !== undefined && target && findRootOwnerId(target) === options.rootId) {
    return true;
  }

  return options.boundsElement != null && isMouseWithinBounds(event, options.boundsElement);
}

function findRootOwnerId(node: Node): string | undefined {
  if (isHTMLElement(node) && node.hasAttribute('data-rootownerid')) {
    return node.getAttribute('data-rootownerid')!;
  }

  if (isLastTraversableNode(node)) {
    return undefined;
  }

  return findRootOwnerId(getParentNode(node));
}

/**
 * Returns a function that listens once for the document `mouseup` ending a press. Listening again
 * or unmounting removes a pending listener, so callers only need the returned cleanup to remove it
 * sooner.
 */
export function usePressReleaseListener() {
  const abortControllerRef = React.useRef<AbortController | null>(null);

  React.useEffect(() => () => abortControllerRef.current?.abort(), []);

  return useStableCallback((doc: Document, listener: (event: MouseEvent) => void) => {
    abortControllerRef.current?.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    doc.addEventListener('mouseup', listener, { once: true, signal: abortController.signal });
    return () => abortController.abort();
  });
}
