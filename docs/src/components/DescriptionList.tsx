'use client';
import * as React from 'react';
import clsx from 'clsx';

export function Root({ className, ...props }: React.ComponentProps<'dl'>) {
  return <dl className={clsx('DescriptionList', className)} {...props} />;
}

export function Term({ className, ...props }: React.ComponentProps<'dt'>) {
  return <dt className={clsx('DescriptionTerm', className)} {...props} />;
}

export function Details({ className, ...props }: React.ComponentProps<'dd'>) {
  return <dd className={clsx('DescriptionDetails', className)} {...props} />;
}
