import { FloatingTreeType } from '../../floating-ui-react';
import { contains, getNodeChildren } from '../../floating-ui-react/utils';

interface Targets {
  currentTarget: HTMLElement | null;
  relatedTarget: HTMLElement | null;
}

interface Params {
  popupElement: HTMLElement | null;
  viewportElement?: HTMLElement | null | undefined;
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
    : false;

  const floatingElement = popupElement || viewportElement;
  const relatedTargetInConnectedFloating = tree
    ? tree.nodesRef.current.some((node) => {
        const nodeFloatingElement = node.context?.elements.floating;
        const nodeReferenceElement = node.context?.elements.domReference;

        if (!contains(nodeFloatingElement, relatedTarget)) {
          return false;
        }

        return (
          contains(rootRef.current, nodeReferenceElement) ||
          contains(floatingElement, nodeReferenceElement)
        );
      })
    : false;

  // For nested scenarios without popupElement, we need to be more lenient
  // and only close if we're definitely outside the root
  if (!popupElement) {
    return (
      !contains(rootRef.current, relatedTarget) &&
      !nodeChildrenContains &&
      !relatedTargetInConnectedFloating
    );
  }

  return (
    !contains(floatingElement, currentTarget) &&
    !contains(floatingElement, relatedTarget) &&
    !contains(rootRef.current, relatedTarget) &&
    !nodeChildrenContains &&
    !relatedTargetInConnectedFloating &&
    !(
      contains(floatingElement, relatedTarget) &&
      relatedTarget?.hasAttribute('data-base-ui-focus-guard')
    )
  );
}
