import { FloatingTreeType } from '../../floating-ui-react';
import { contains, getNodeChildren } from '../../floating-ui-react/utils';

interface Targets {
  currentTarget: HTMLElement | null;
  relatedTarget: HTMLElement | null;
}

interface Params {
  popupElement: HTMLElement | null;
  viewportElement?: (HTMLElement | null) | undefined;
  rootRef: React.RefObject<HTMLDivElement | null>;
  tree: FloatingTreeType | null;
  nodeId: string | undefined;
}

export function isOutsideMenuEvent({ currentTarget, relatedTarget }: Targets, params: Params) {
  const { popupElement, viewportElement, rootRef, tree, nodeId } = params;

  const nodeChildrenContains = tree
    ? getNodeChildren(tree.nodesRef.current, nodeId).some((node) =>
        contains(node.context?.elements.floating, relatedTarget),
      )
    : [];

  // For nested scenarios without popupElement, we need to be more lenient
  // and only close if we're definitely outside the root
  if (!popupElement) {
    return !contains(rootRef.current, relatedTarget) && !nodeChildrenContains;
  }

  // Use popupElement as the primary floating element, but fall back to viewportElement if needed
  const floatingElement = popupElement || viewportElement;

  return (
    !contains(floatingElement, currentTarget) &&
    !contains(floatingElement, relatedTarget) &&
    !contains(rootRef.current, relatedTarget) &&
    !nodeChildrenContains &&
    !(
      contains(floatingElement, relatedTarget) &&
      relatedTarget?.hasAttribute('data-base-ui-focus-guard')
    )
  );
}
