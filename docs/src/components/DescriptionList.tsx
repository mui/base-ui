'use client';
import * as React from 'react';
import clsx from 'clsx';

export function Root(props: React.ComponentProps<'dl'>) {
  return <dl {...props} className={clsx('DescriptionList', props.className)} />;
}

export function Term(props: React.ComponentProps<'dt'>) {
  return <dt {...props} className={clsx('DescriptionTerm', props.className)} />;
}

export function Details(props: React.ComponentProps<'dd'>) {
  return <dd {...props} className={clsx('DescriptionDetails', props.className)} />;
}
