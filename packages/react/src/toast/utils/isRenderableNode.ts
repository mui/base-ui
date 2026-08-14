import * as React from 'react';

export function isRenderableNode(node: React.ReactNode): boolean {
  if (node == null || typeof node === 'boolean' || node === '') {
    return false;
  }
  if (Array.isArray(node)) {
    return node.some(isRenderableNode);
  }
  return true;
}

export function hasRenderableChildren(element: React.ReactNode): boolean {
  return (
    React.isValidElement<{ children?: React.ReactNode }>(element) &&
    isRenderableNode(element.props.children)
  );
}
