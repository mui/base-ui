import * as React from 'react';

export interface BenchmarkRow {
  id: number;
  label: string;
  value: string;
}

export function createRows(count: number, labelPrefix = 'Item'): BenchmarkRow[] {
  return Array.from({ length: count }, (_, index) => {
    const id = index + 1;
    return {
      id,
      label: `${labelPrefix} ${id}`,
      value: `${labelPrefix.toLowerCase().replace(/\s+/g, '-')}-${id}`,
    };
  });
}

export function MountList(props: {
  rows: BenchmarkRow[];
  style?: React.CSSProperties;
  children: (row: BenchmarkRow) => React.ReactNode;
}) {
  const { rows, style, children } = props;
  return <div style={style}>{rows.map((row) => children(row))}</div>;
}
