'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { isElement, isShadowRoot } from '@floating-ui/utils/dom';
import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';
import { ToastAnnouncerContext } from '../provider/ToastProviderContext';

interface ToastAnnouncerProps {
  rootRef: React.RefObject<HTMLElement | null>;
  priority: 'low' | 'high' | undefined;
  limited: boolean | undefined;
  titleId: string | undefined;
  descriptionId: string | undefined;
  toastId: string;
  updateKey: number | undefined;
  transitionStatus: 'starting' | 'ending' | undefined;
}

function getAnnouncementText(element: Readonly<Element> | null): string {
  if (
    !element ||
    element.hasAttribute('hidden') ||
    element.getAttribute('aria-hidden') === 'true'
  ) {
    return '';
  }
  const style = ownerWindow(element).getComputedStyle(element);
  if (
    style.display === 'none' ||
    style.visibility === 'hidden' ||
    style.visibility === 'collapse'
  ) {
    return '';
  }
  if (element.localName === 'img') {
    return ` ${element.getAttribute('alt') ?? ''} `;
  }
  if (element.localName === 'br') {
    return ' ';
  }
  const text = Array.from(element.childNodes, (node) => {
    if (isElement(node)) {
      return getAnnouncementText(node);
    }
    return node.nodeType === 3 ? (node.textContent ?? '') : '';
  }).join('');
  // Block layout separates words that textContent would otherwise concatenate.
  return /^(block|flow-root|flex|grid|table|list-item)/.test(style.display) ? ` ${text} ` : text;
}

export function ToastAnnouncer(props: ToastAnnouncerProps) {
  const {
    rootRef,
    priority,
    limited,
    titleId,
    descriptionId,
    toastId,
    updateKey,
    transitionStatus,
  } = props;
  const announcers = React.useContext(ToastAnnouncerContext);
  const target = priority === 'high' ? announcers.assertive : announcers.polite;
  const endingRef = React.useRef(false);
  const [snapshot, setSnapshot] = React.useState<{
    text: string[];
    target: HTMLDivElement;
    toastId: string;
    key: number;
  } | null>(null);

  React.useEffect(() => {
    const restarted = endingRef.current && transitionStatus !== 'ending';
    endingRef.current = transitionStatus === 'ending';
    const element = rootRef.current;
    if (
      !element ||
      !target ||
      limited ||
      transitionStatus === 'ending' ||
      (!titleId && !descriptionId)
    ) {
      return;
    }

    const treeRoot = element.getRootNode();
    const root = isShadowRoot(treeRoot) ? treeRoot : ownerDocument(element);
    const titleElement = titleId ? root.getElementById(titleId) : null;
    const descriptionElement = descriptionId ? root.getElementById(descriptionId) : null;
    const title = getAnnouncementText(titleElement).replace(/\s+/g, ' ').trim();
    const description = getAnnouncementText(descriptionElement).replace(/\s+/g, ' ').trim();
    const text = [title, description].filter(Boolean);
    setSnapshot((previous) => {
      if (
        !restarted &&
        previous?.toastId === toastId &&
        previous.target === target &&
        previous.text.length === text.length &&
        previous.text.every((part, index) => part === text[index])
      ) {
        return previous;
      }
      // aria-relevant="additions" needs an inserted node, not an in-place text update.
      return { text, target, toastId, key: (previous?.key ?? 0) + 1 };
    });
  }, [rootRef, target, limited, titleId, descriptionId, toastId, updateKey, transitionStatus]);

  return snapshot && snapshot.text.length > 0
    ? ReactDOM.createPortal(
        <div key={snapshot.key}>{snapshot.text.join(' ')}</div>,
        snapshot.target,
      )
    : null;
}
