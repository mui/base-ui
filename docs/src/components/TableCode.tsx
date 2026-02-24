import * as React from 'react';
import clsx from 'clsx';
import { Code } from './Code';
import { getChildrenText } from '../utils/getChildrenText';

export interface TableCodeProps extends React.ComponentProps<'code'> {
  printWidth?: number;
}

/** An inline code component that breaks long union types into multiple lines */
export function TableCode({ children, className, printWidth = 40, ...props }: TableCodeProps) {
  const text = getChildrenText(children);

  if (text.includes('|') && text.length > printWidth) {
    const unionGroups: React.ReactNode[][] = [];
    const parts = React.Children.toArray(children);

    let parenDepth = 0;
    let braceDepth = 0;
    let groupIndex = 0;
    unionGroups.push([]);

    parts.forEach((child, index) => {
      const str = getChildrenText(child);

      // Track parentheses depth
      str.split('(').forEach(() => {
        parenDepth += 1;
      });
      str.split(')').forEach(() => {
        parenDepth -= 1;
      });
      // Track braces depth
      str.split('{').forEach(() => {
        braceDepth += 1;
      });
      str.split('}').forEach(() => {
        braceDepth -= 1;
      });

      // Break only on top-level pipes (not inside parens or braces)
      if (str.trim() === '|' && parenDepth <= 0 && braceDepth <= 0 && index !== 0) {
        unionGroups.push([]);
        groupIndex += 1;
        return;
      }

      unionGroups[groupIndex].push(child);
    });

    // Insert pipe fragments before each group
    if (unionGroups.length > 1) {
      const enhanced: React.ReactNode[] = [];
      unionGroups.forEach((group, idx) => {
        const pipeElem = <span style={{ color: 'var(--syntax-keyword)' }}>| </span>;
        if (idx === 0) {
          // Leading pipe for first group
          enhanced.push(<React.Fragment key={`pipe-${idx}`}>{pipeElem}</React.Fragment>);
        } else {
          // Newline plus pipe for subsequent groups
          enhanced.push(
            <React.Fragment key={`pipe-${idx}`}>
              <br />
              {pipeElem}
            </React.Fragment>,
          );
        }
        enhanced.push(...group);
      });
      children = enhanced;
    }
  }

  return (
    <Code data-table-code="" className={clsx('TableCode', className)} {...props}>
      {children}
    </Code>
  );
}
