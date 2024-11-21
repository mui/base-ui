import * as React from 'react';
import clsx from 'clsx';

interface PopupProps extends React.ComponentProps<'div'> {
  /** Whether the transitions should be instant */
  instant?: boolean;
}

export function Popup({ className, instant, ...props }: PopupProps) {
  return (
    <div data-instant={instant || undefined} className={clsx('Popup', className)} {...props} />
  );
}
