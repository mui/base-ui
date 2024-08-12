import * as React from 'react';
import clsx from 'clsx';
import classes from './Demo.module.css';

export function Demo(props: React.ComponentProps<'div'>) {
  return <div {...props} className={clsx(classes.root, props.className)} />;
}
