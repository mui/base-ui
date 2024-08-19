import * as React from 'react';
import clsx from 'clsx';
import classes from './Callout.module.css';

export interface CalloutProps {
  children: React.ReactNode;
  type: 'info' | 'warning' | 'error' | 'success';
}

export function Callout(props: CalloutProps) {
  const { children, type } = props;
  return <div className={clsx(classes.root, classes[type])}>{children}</div>;
}
