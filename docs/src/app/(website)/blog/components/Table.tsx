import * as React from 'react';
import clsx from 'clsx';
import './Table.css';

export function Root(props: React.ComponentProps<'table'>) {
  return <table {...props} className={clsx('TableBlogRoot', props.className)} />;
}

export function Head(props: React.ComponentProps<'thead'>) {
  return <thead {...props} className={clsx('TableBlogHead', props.className)} />;
}

export function Body(props: React.ComponentProps<'tbody'>) {
  return <tbody {...props} className={clsx('TableBlogBody', props.className)} />;
}

export function Row(props: React.ComponentProps<'tr'>) {
  return <tr {...props} className={clsx('TableBlogRow', props.className)} />;
}

export function ColumnHeader(props: Omit<React.ComponentProps<'th'>, 'scope'>) {
  return <th scope="col" {...props} className={clsx('TableBlogColumnHeader', props.className)} />;
}

export function RowHeader(props: Omit<React.ComponentProps<'th'>, 'scope'>) {
  return <th scope="row" {...props} className={clsx('TableBlogCell', props.className)} />;
}

export function Cell(props: React.ComponentProps<'td'>) {
  return <td {...props} className={clsx('TableBlogCell', props.className)} />;
}
