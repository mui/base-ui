'use client';

import * as React from 'react';
import clsx from 'clsx';
import * as ScrollArea from 'docs/src/components/ScrollArea';
import './AffordedScroll.css';

export function Root({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <ScrollArea.Root
      {...props}
      className={clsx('AffordedScroll', className)}
      overflowEdgeThreshold={1}
    />
  );
}

export function Viewport({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <React.Fragment>
      <ScrollArea.Viewport {...props} className={clsx('AffordedScrollViewport', className)} />
      <ScrollArea.Scrollbar className="AffordedScrollScrollbar" orientation="horizontal" />
    </React.Fragment>
  );
}
