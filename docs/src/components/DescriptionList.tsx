'use client';
import * as React from 'react';
import clsx from 'clsx';

export function Root(props: React.ComponentProps<'dl'>) {
  return <dl {...props} className={clsx('DescriptionList', props.className)} />;
}

export function Term({
  separator = false,
  ...props
}: React.ComponentProps<'dt'> & { separator?: boolean }) {
  return (
    <dt {...props} className={clsx('DescriptionTerm', separator && 'separator', props.className)}>
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

export function Separator(props: React.ComponentProps<'div'>) {
  return <div {...props} className={clsx('DescriptionListSeparator', props.className)} />;
}

function Inner(props: React.ComponentProps<'div'>) {
  return <div {...props} className={clsx('DescriptionListInner gap-3 w-full', props.className)} />;
}
