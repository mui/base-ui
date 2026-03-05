import clsx from 'clsx';
import * as React from 'react';
import './Code.css';

interface CodeProps extends React.ComponentProps<'code'> {
  variant?: 'component' | 'prop' | 'html' | 'js' | 'css';
}

export function Code({ variant, ...props }: CodeProps) {
  return (
    <code
      {...props}
      className={clsx('Code', variant ? `Code-${variant}` : undefined, props.className)}
    />
  );
}
