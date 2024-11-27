'use client';
import * as React from 'react';
import clsx from 'clsx';

export function Root({ children, className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div className={clsx('TableRoot', className)} {...props}>
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
      ref={observeInnerScrollable}
      className={clsx('TableCell', className)}
      {...props}
    >
      <span className="TableCellInner">{children}</span>
    </th>
  );
}

export function Cell({ children, className, ...props }: React.ComponentProps<'td'>) {
  return (
    <td ref={observeInnerScrollable} className={clsx('TableCell', className)} {...props}>
      <span className="TableCellInner">{children}</span>
    </td>
  );
}

// Observe whether the "TableCellInner" node is scrollable and set a "[data-scrollable]"
// attribute on the parent cell. We are rawdogging the DOM changes here to skip unnecessary renders.
function observeInnerScrollable(node: HTMLElement | null) {
  if (!node) {
    return;
  }

  const inner = node.children[0] as HTMLElement;
  const observer = new ResizeObserver(() => {
    if (inner.scrollWidth > inner.offsetWidth) {
      node.setAttribute('data-scrollable', '');
    } else {
      node.removeAttribute('data-scrollable');
    }
  });

  if (inner) {
    observer.observe(inner);
  } else {
    console.warn('Expected to find a TableCellInner element');
  }
}
