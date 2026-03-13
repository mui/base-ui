'use client';
import * as React from 'react';
import { useTimeout } from '@base-ui/utils/useTimeout';

const LIVE_REGION_MARKER = '\u2060';

function findLastTextNode(root: HTMLElement): Text | null {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let lastTextNode: Text | null = null;

  while (walker.nextNode()) {
    const textNode = walker.currentNode as Text;
    if (textNode.nodeValue !== '') {
      lastTextNode = textNode;
    }
  }

  return lastTextNode;
}

export function useInitialLiveRegionTextMutation<T extends HTMLElement>() {
  const timeout = useTimeout();
  const rootRef = React.useRef<T | null>(null);

  React.useEffect(() => {
    const root = rootRef.current;
    if (root == null) {
      return undefined;
    }

    const textNode = findLastTextNode(root);
    if (textNode == null) {
      return undefined;
    }

    const originalValue = textNode.nodeValue ?? '';
    const markedValue = `${originalValue}${LIVE_REGION_MARKER}`;
    textNode.nodeValue = markedValue;

    timeout.start(0, () => {
      if (textNode.nodeValue === markedValue) {
        textNode.nodeValue = originalValue;
      }
    });

    return () => {
      timeout.clear();

      if (textNode.nodeValue === markedValue) {
        textNode.nodeValue = originalValue;
      }
    };
  }, [rootRef, timeout]);

  return rootRef;
}
