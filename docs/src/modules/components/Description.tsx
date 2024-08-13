import * as React from 'react';
import clsx from 'clsx';
import classes from './Description.module.css';

export function Description(props: React.ComponentProps<'p'>) {
  return (
    <p
      {...props}
      className={clsx('Text size-5 weight-1 color-gray', classes.root, props.className)}
    />
  );
}
