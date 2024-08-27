import * as React from 'react';
import clsx from 'clsx';
import classes from './IconButton.module.css';
import { Tooltip } from './Tooltip';

export function IconButton(props: IconButton.Props) {
  const { size = 1, label, withTooltip, ...other } = props;
  const button = (
    <button
      type="button"
      aria-label={label}
      {...other}
      className={clsx(classes.root, classes[`size-${size}`], props.className)}
    />
  );

  if (withTooltip) {
    return <Tooltip label={label}>{button}</Tooltip>;
  }

  return button;
}

export namespace IconButton {
  export interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    size?: 1 | 2 | 3;
    label: string;
    withTooltip?: boolean;
  }
}
