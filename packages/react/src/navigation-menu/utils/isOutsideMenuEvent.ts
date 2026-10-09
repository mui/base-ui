import { contains } from '@base-ui/utils/shadowDom';
import type { PopupTreeType } from '../../utils/popups/types';

interface Targets {
  currentTarget: HTMLElement | null;
  relatedTarget: HTMLElement | null;
}

interface Params {
  popupElement: HTMLElement | null;
  rootRef: React.RefObject<HTMLDivElement | null>;
  tree: PopupTreeType | null;
  nodeId: string | undefined;
}

export function isOutsideMenuEvent({ currentTarget, relatedTarget }: Targets, params: Params) {
  const { popupElement, rootRef, tree, nodeId } = params;

  const nodeChildrenContains = tree ? tree.descendantContains(nodeId, relatedTarget) : false;

  if (!popupElement) {
    return !contains(rootRef.current, relatedTarget) && !nodeChildrenContains;
  }

  return (
    !contains(popupElement, currentTarget) &&
    !contains(popupElement, relatedTarget) &&
    !contains(rootRef.current, relatedTarget) &&
    !nodeChildrenContains
  );
}
