'use client';
import * as React from 'react';
import { Virtualizer } from '@base-ui/react/virtualizer';
import styles from './index.module.css';

export default function ExampleVirtualizedTable() {
  return (
    <div className={styles.Scroller}>
      <table className={styles.Table} aria-rowcount={issues.length + 1}>
        <colgroup>
          <col className={styles.NumberColumn} />
          <col />
          <col className={styles.StatusColumn} />
          <col className={styles.CommentsColumn} />
        </colgroup>
        <thead>
          <tr>
            <th scope="col" className={styles.HeaderCell}>
              #
            </th>
            <th scope="col" className={styles.HeaderCell}>
              Title
            </th>
            <th scope="col" className={styles.HeaderCell}>
              Status
            </th>
            <th scope="col" className={styles.HeaderCell}>
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
              <td className={styles.Cell}>{issue.number}</td>
              <td className={styles.Cell}>{issue.title}</td>
              <td className={styles.Cell}>{issue.status}</td>
              <td className={styles.Cell}>{issue.comments}</td>
            </tr>
          )}
        </Virtualizer>
      </table>
    </div>
  );
}

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
