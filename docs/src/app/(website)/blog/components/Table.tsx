import * as React from 'react';
import clsx from 'clsx';
import * as AffordedScroll from './AffordedScroll';
import './Table.css';

export function Root({ className, ...props }: React.ComponentProps<'table'>) {
  return (
    <AffordedScroll.Root className={clsx('BlogTableRoot', className)}>
      <AffordedScroll.Viewport>
        <table {...props} className="BlogTable" />
      </AffordedScroll.Viewport>
    </AffordedScroll.Root>
  );
}

export function Head(props: React.ComponentProps<'thead'>) {
  return <thead {...props} className={clsx('BlogTableHead', props.className)} />;
}

export function Body(props: React.ComponentProps<'tbody'>) {
  return <tbody {...props} className={clsx('BlogTableBody', props.className)} />;
}

export function Row(props: React.ComponentProps<'tr'>) {
  return <tr {...props} className={clsx('BlogTableRow', props.className)} />;
}

export function ColumnHeader(props: Omit<React.ComponentProps<'th'>, 'scope'>) {
  return <th scope="col" {...props} className={clsx('BlogTableColumnHeader', props.className)} />;
}

export function RowHeader(props: Omit<React.ComponentProps<'th'>, 'scope'>) {
  return <th scope="row" {...props} className={clsx('BlogTableCell', props.className)} />;
}

export function Cell(props: React.ComponentProps<'td'>) {
  return <td {...props} className={clsx('BlogTableCell', props.className)} />;
}
