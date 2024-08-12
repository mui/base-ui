import * as React from 'react';
import clsx from 'clsx';
import classes from './ComponentLinkHeader.module.css';

export function ComponentLinkHeader(props: React.ComponentProps<'div'>) {
  return <div {...props} className={clsx(classes.root, props.className)} />;
}
