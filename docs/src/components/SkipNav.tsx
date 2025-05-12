import * as React from 'react';
import clsx from 'clsx';

export function SkipNav({ className, ...props }: React.ComponentProps<'a'>) {
  return <a className={clsx('SkipNav', className)} href={MAIN_CONTENT_ID} {...props} />;
}

export const MAIN_CONTENT_ID = '#main-content';
