'use client';
import * as React from 'react';
import clsx from 'clsx';

export function Root(props: React.ComponentProps<'dl'>) {
  return <dl {...props} className={clsx('DescriptionList', props.className)} />;
}

function Inner(props: React.ComponentProps<'div'>) {
  return <div {...props} className={clsx('DescriptionListInner gap-3 w-full', props.className)} />;
}

export function Term(props: React.ComponentProps<'dt'>) {
  return (
    <dt {...props} className={clsx('DescriptionTerm', props.className)}>
      <Inner>{props.children}</Inner>
    </dt>
  );
}

export function Details(props: React.ComponentProps<'dd'>) {
  return (
    <dd {...props} className={clsx('DescriptionDetails', props.className)}>
      <Inner>{props.children}</Inner>
    </dd>
  );
}

export function Item(props: React.ComponentProps<'div'>) {
  return <div {...props} className={clsx('DescriptionListItem', props.className)} />;
}
