'use client';
import * as React from 'react';
import clsx from 'clsx';
import { observeScrollableInner } from '../utils/observeScrollableInner';

export function Root({ children, ...props }: React.ComponentProps<'div'>) {
  return (
    <div {...props} className={clsx('TableRoot', props.className)}>
      <table className="TableRootTable">{children}</table>
    </div>
  );
}

export function Head({ className, ...props }: React.ComponentProps<'thead'>) {
  return <thead className={clsx('TableHead', className)} {...props} />;
}

export function Body({ className, ...props }: React.ComponentProps<'tbody'>) {
  return <tbody className={clsx('TableBody', className)} {...props} />;
}

export function Row({ className, ...props }: React.ComponentProps<'tr'>) {
  return <tr className={clsx('TableRow', className)} {...props} />;
}

export function ColumnHeader({
  children,
  className,
  ...props
}: Omit<React.ComponentProps<'th'>, 'scope'>) {
  return (
    <th scope="col" className={clsx('TableColumnHeader', className)} {...props}>
      <span className="TableCellInner">{children}</span>
    </th>
  );
}

export function RowHeader({
  children,
  className,
  ...props
}: Omit<React.ComponentProps<'th'>, 'scope'>) {
  return (
    <th
      scope="row"
      ref={observeScrollableInner}
      className={clsx('TableCell', className)}
      {...props}
    >
      <span className="TableCellInner">{children}</span>
    </th>
  );
}

export function Cell({ children, className, ...props }: React.ComponentProps<'td'>) {
  return (
    <td ref={observeScrollableInner} className={clsx('TableCell', className)} {...props}>
      <span className="TableCellInner">{children}</span>
    </td>
  );
}
