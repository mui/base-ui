'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { isShadowRoot } from '@floating-ui/utils/dom';
import { ownerDocument } from '@base-ui/utils/owner';
import { ToastAnnouncerContext } from '../provider/ToastProviderContext';

interface ToastAnnouncerProps {
  rootRef: React.RefObject<HTMLElement | null>;
  priority: 'low' | 'high' | undefined;
  limited: boolean | undefined;
  titleId: string | undefined;
  descriptionId: string | undefined;
}

export function ToastAnnouncer(props: ToastAnnouncerProps) {
  const { rootRef, priority, limited, titleId, descriptionId } = props;
  const announcers = React.useContext(ToastAnnouncerContext);
  const target = priority === 'high' ? announcers.assertive : announcers.polite;
  const [snapshot, setSnapshot] = React.useState<{ text: string[]; target: HTMLDivElement } | null>(
    null,
  );

  React.useEffect(() => {
    const element = rootRef.current;
    if (!element || snapshot || !target || limited || (!titleId && !descriptionId)) {
      return;
    }

    const treeRoot = element.getRootNode();
    const root = isShadowRoot(treeRoot) ? treeRoot : ownerDocument(element);
    const title = titleId && root.getElementById(titleId)?.textContent;
    const description = descriptionId && root.getElementById(descriptionId)?.textContent;
    // Keep the title and description as separate message fragments so SRs pause speech between them.
    const text = [title, description].filter((text): text is string => Boolean(text));
    setSnapshot({ text, target });
  }, [rootRef, target, limited, titleId, descriptionId, snapshot]);

  return snapshot && snapshot.text.length > 0
    ? ReactDOM.createPortal(<div>{snapshot.text}</div>, snapshot.target)
    : null;
}
