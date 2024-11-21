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

export function HeaderCell({ children, className, ...props }: React.ComponentProps<'th'>) {
  return (
    <th scope="col" className={clsx('TableHeaderCell', className)} {...props}>
      <span className="TableCellInner">{children}</span>
    </th>
  );
}

export function Cell({ children, className, ...props }: React.ComponentProps<'td'>) {
  return (
    <td className={clsx('TableCell', className)} {...props}>
      <span className="TableCellInner">{children}</span>
    </td>
  );
}
