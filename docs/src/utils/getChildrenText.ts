import * as React from 'react';

export function getChildrenText(children?: React.ReactNode): string {
  if (hasChildren(children)) {
    return getChildrenText(children.props?.children);
  }

  if (Array.isArray(children)) {
    return children.map(getChildrenText).flat().filter(Boolean).join('');
  }

  if (typeof children === 'string') {
    return children;
  }

  return '';
}

function hasChildren(
  element?: React.ReactNode,
): element is React.ReactElement<React.PropsWithChildren> {
  return (
    React.isValidElement(element) &&
    typeof element.props === 'object' &&
    !!element.props &&
    'children' in element.props &&
    Boolean(element.props.children)
  );
}
