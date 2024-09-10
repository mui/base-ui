import * as React from 'react';
import clsx from 'clsx';
import classes from './Description.module.css';

export interface DescriptionProps extends React.ComponentProps<'p'> {
  text?: string;
}

export function Description(props: DescriptionProps) {
  const { text, children, ...other } = props;

  return (
    <p
      {...other}
      className={clsx('Text size-5 weight-1 color-gray', classes.root, props.className)}
    >
      {text ?? children}
    </p>
  );
}
