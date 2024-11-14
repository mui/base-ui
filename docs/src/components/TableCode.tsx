import * as React from 'react';

interface TableCodeProps extends React.ComponentProps<'code'> {
  printWidth?: number;
}

/** An inline code component that breaks long union types into multiple lines */
export function TableCode({ children, printWidth = 40, ...props }: TableCodeProps) {
  const text = getTextContents(children);

  if (text.includes('|') && text.length > printWidth) {
    const unionGroups: React.ReactNode[][] = [];
    const parts = React.Children.toArray(children);

    let depth = 0;
    let groupIndex = 0;
    parts.forEach((child, index) => {
      if (index === 0) {
        unionGroups.push([child]);
        return;
      }

      if (getTextContents(child).trim() === '|' && depth < 1) {
        groupIndex += 1;
        unionGroups.push([]);
        return;
      }

      if (getTextContents(child).trim() === '(') {
        depth += 1;
      }

      if (getTextContents(child).trim() === ')') {
        depth -= 1;
      }

      unionGroups[groupIndex].push(child);
    });

    if (unionGroups.length > 1) {
      unionGroups.forEach((_, index) => {
        const pipe = <span style={{ color: 'var(--syntax-keyword)' }}>| </span>;
        const pipeWithNewline = (
          <React.Fragment>
            <br />
            {pipe}
          </React.Fragment>
        );

        const element = index === 0 ? pipe : pipeWithNewline;
        unionGroups.splice(index * 2, 0, [element]);
      });
    }

    children = unionGroups.flat();
  }

  return <code {...props}>{children}</code>;
}

function getTextContents(node?: React.ReactNode): string {
  if (hasChildren(node)) {
    return getTextContents(node.props?.children);
  }

  if (Array.isArray(node)) {
    return node.map(getTextContents).flat().filter(Boolean).join('');
  }

  if (typeof node === 'string') {
    return node;
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
