import { FloatingTreeType } from '../../floating-ui-react';
import { contains, getNodeChildren } from '../../floating-ui-react/utils';

interface Params {
  popupElement: HTMLElement;
  rootRef: React.RefObject<HTMLDivElement | null>;
  tree: FloatingTreeType;
  nodeId: string | undefined;
}

export function isOutsideMenuEvent(relatedTarget: HTMLElement | null, params: Params) {
  const { popupElement, rootRef, tree, nodeId } = params;

  const nodeChildrenContains = getNodeChildren(tree.nodesRef.current, nodeId).some((node) =>
    contains(node.context?.elements.floating, relatedTarget),
  );

  return (
    !contains(popupElement, relatedTarget) &&
    !contains(rootRef.current, relatedTarget) &&
    !nodeChildrenContains
  );
}
