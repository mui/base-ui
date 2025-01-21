import * as React from 'react';
import clsx from 'clsx';
import { Code } from './Code';
import { getChildrenText } from '../utils/getChildrenText';

interface TableCodeProps extends React.ComponentProps<'code'> {
  printWidth?: number;
}

/** An inline code component that breaks long union types into multiple lines */
export function TableCode({ children, className, printWidth = 40, ...props }: TableCodeProps) {
  const text = getChildrenText(children);

  if (text.includes('|') && text.length > printWidth) {
    const unionGroups: React.ReactNode[][] = [];
    const parts = React.Children.toArray(children);

    let depth = 0;
    let groupIndex = 0;
    parts.forEach((child, index) => {
      if (index === 0) {
        unionGroups.push([]);
      }

      const str = getChildrenText(child);

      // Solo function return values shouldn't be broken up, e.g. in:
      // `(value) => string | string[] | null | Promise`
      if (str.includes('=>') && depth < 1) {
        depth += 1;
      }

      if (str.trim() === '|' && depth < 1 && index !== 0) {
        unionGroups.push([]);
        groupIndex += 1;
        return;
      }

      str.split('(').forEach(() => {
        depth += 1;
      });

      str.split(')').forEach(() => {
        depth -= 1;
      });

      unionGroups[groupIndex].push(child);
    });

    if (unionGroups.length > 1) {
      unionGroups.forEach((_, index) => {
        const pipe = <span style={{ color: 'var(--syntax-keyword)' }}>| </span>;
        const pipeWithNewline = (
          <React.Fragment key={`fragment-${index}`}>
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

  return (
    <Code data-table-code="" className={clsx('text-xs', className)} {...props}>
      {children}
    </Code>
  );
}
