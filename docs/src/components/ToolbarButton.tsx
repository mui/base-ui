import clsx from 'clsx';
import * as React from 'react';

export function ToolbarButton({ className, ...props }: React.ComponentProps<'button'>) {
  return <button type="button" className={clsx('ToolbarButton', className)} {...props} />;
}
