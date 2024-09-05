import * as React from 'react';
import clsx from 'clsx';
import classes from './Button.module.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  accented?: boolean;
}

export function Button(props: ButtonProps) {
  const { accented, className: classNameProp, ...other } = props;
  const className = clsx(classes.root, classNameProp, accented && classes.accent);

  return <button type="button" {...other} className={className} />;
}
