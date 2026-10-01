'use client';
import * as React from 'react';
import { Virtualizer } from '@base-ui/react/virtualizer';

export default function ExampleVirtualizedTable() {
  return (
    <div className="box-border h-80 w-full overflow-auto border border-neutral-950 scroll-pt-8 dark:border-white">
      <table
        className="w-full table-fixed border-collapse text-sm leading-5 text-neutral-950 dark:text-white"
        aria-rowcount={issues.length + 1}
      >
        <colgroup>
          <col className="w-16" />
          <col />
          <col className="w-20" />
          <col className="w-26" />
        </colgroup>
        <thead>
          <tr>
            <th scope="col" className={headerCellClassName}>
              #
            </th>
            <th scope="col" className={headerCellClassName}>
              Title
            </th>
            <th scope="col" className={headerCellClassName}>
              Status
            </th>
            <th scope="col" className={headerCellClassName}>
              Comments
            </th>
          </tr>
        </thead>
        <Virtualizer
          items={issues}
          getItemKey={(issue) => issue.number}
          layout="table"
          estimatedItemHeight={40}
        >
          {(issue, index, rowProps) => (
            <tr {...rowProps} aria-rowindex={index + 2}>
              <td className={cellClassName}>{issue.number}</td>
              <td className={cellClassName}>{issue.title}</td>
              <td className={cellClassName}>{issue.status}</td>
              <td className={cellClassName}>{issue.comments}</td>
            </tr>
          )}
        </Virtualizer>
      </table>
    </div>
  );
}

const headerCellClassName =
  'sticky top-0 z-10 box-border h-8 bg-white px-2 py-1.5 text-left font-bold shadow-[inset_0_-1px_theme(colors.neutral.950)] dark:bg-neutral-950 dark:shadow-[inset_0_-1px_white]';

const cellClassName = 'border-b border-neutral-200 px-2 py-1.5 align-top dark:border-neutral-800';

interface Issue {
  number: number;
  title: string;
  status: 'Open' | 'Closed';
  comments: number;
}

const components = ['Popover', 'Menu', 'Select', 'Combobox', 'Dialog', 'Tooltip', 'Slider', 'Tabs'];
const problems = [
  'closes on outside click',
  'ignores arrow keys',
  'flickers when opening',
  'loses focus on close',
  'overflows the viewport',
];

const issues: Issue[] = Array.from({ length: 10000 }, (_, index) => {
  const title = `${components[index % components.length]} ${problems[index % problems.length]}`;
  return {
    number: index + 1,
    // Every third title wraps onto a second line, so rows are not all the same height.
    title:
      index % 3 === 0
        ? `${title} when rendered inside a scroll container with a sticky header`
        : title,
    status: index % 4 === 0 ? 'Open' : 'Closed',
    comments: (index * 7) % 23,
  };
});
